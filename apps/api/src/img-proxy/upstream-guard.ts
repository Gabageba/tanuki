import { lookup as dnsLookup, type LookupAddress } from 'node:dns';
import { BlockList, isIP, type LookupFunction } from 'node:net';
import { Agent } from 'undici';

/**
 * Адреса, куда прокси не ходит: loopback, частные сети, link-local (там же облачные метаданные),
 * CGNAT, «этот хост», multicast и зарезервированные. Адрес картинки приходит из снимков закладок и
 * из резервных копий, которые человек загружает сам, — без этого подписанный /img стучался бы во
 * внутреннюю сеть сервера.
 *
 * 198.18.0.0/15 (RFC 2544, тестирование сетей) открыт намеренно: внутренних сервисов там не
 * бывает, а VPN-клиенты в режиме fake-IP (Clash, sing-box) резолвят в него любой хост — закрытый,
 * он ломал бы все картинки на такой машине.
 */
const BLOCKED = new BlockList();
for (const [network, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.168.0.0', 16],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const) {
  BLOCKED.addSubnet(network, prefix, 'ipv4');
}
for (const [network, prefix] of [
  ['::', 128],
  ['::1', 128],
  ['fc00::', 7],
  ['fe80::', 10],
  ['ff00::', 8],
] as const) {
  BLOCKED.addSubnet(network, prefix, 'ipv6');
}

/** IPv4, записанный как IPv6 (`::ffff:127.0.0.1`), проверяется как IPv4. */
const MAPPED_IPV4 = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i;

export const isBlockedAddress = (address: string) => {
  const mapped = MAPPED_IPV4.exec(address)?.[1];
  if (mapped) return BLOCKED.check(mapped, 'ipv4');
  const family = isIP(address);
  if (family === 0) return true;
  return BLOCKED.check(address, family === 4 ? 'ipv4' : 'ipv6');
};

/**
 * Можно ли вообще идти по этому адресу: только http(s), и хост-литерал IP — не из закрытых
 * сетей. Имя хоста проверяет уже `lookup` агента, после DNS: иначе имя, указывающее на
 * 127.0.0.1, прошло бы проверку.
 */
export const isAllowedUpstreamUrl = (url: string) => {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
  const host = parsed.hostname.replace(/^\[|\]$/g, '');
  return isIP(host) === 0 || !isBlockedAddress(host);
};

/** Ошибка для undici: соединение с закрытым адресом не открывается. */
const blockedError = (hostname: string) =>
  Object.assign(new Error(`Адрес ${hostname} закрыт для прокси картинок`), { code: 'EBLOCKED' });

/**
 * `lookup` для соединений прокси: резолвит как обычно и отказывает, если хоть один адрес закрыт.
 * Проверка — на том же адресе, к которому затем идёт соединение, так что подменить DNS между
 * проверкой и запросом не выйдет.
 */
export const guardedLookup: LookupFunction = (hostname, options, callback) => {
  dnsLookup(hostname, { ...options, all: true }, (error, addresses: LookupAddress[]) => {
    if (error) {
      callback(error, '', 0);
      return;
    }
    if (addresses.length === 0 || addresses.some(({ address }) => isBlockedAddress(address))) {
      callback(blockedError(hostname), '', 0);
      return;
    }
    if (options.all) {
      (callback as unknown as (err: null, addresses: LookupAddress[]) => void)(null, addresses);
      return;
    }
    const [first] = addresses;
    callback(null, first!.address, first!.family);
  });
};

/** Агент прокси картинок: каждое соединение проходит через `guardedLookup`. */
export const createUpstreamAgent = () => new Agent({ connect: { lookup: guardedLookup } });
