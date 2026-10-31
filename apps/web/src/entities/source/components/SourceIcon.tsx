import type { AvatarProps, MantineStyleProp } from '@mantine/core';
import { Avatar } from '@mantine/core';
import { SOURCE_ID, type Source, type SourceId } from '@tanuki/contracts';
import acomics from '../../../assets/sources/ACOMICS.png';
import allhentai from '../../../assets/sources/ALLHENTAI.png';
import comx from '../../../assets/sources/COMX.png';
import desume from '../../../assets/sources/DESUME.png';
import hentaichanCc from '../../../assets/sources/HENTAICHAN_CC.png';
import hentailib from '../../../assets/sources/HENTAILIB.png';
import inkstory from '../../../assets/sources/INKSTORY.png';
import mangabuff from '../../../assets/sources/MANGABUFF.png';
import mangachan from '../../../assets/sources/MANGACHAN.png';
import mangalib from '../../../assets/sources/MANGALIB.png';
import mintmanga from '../../../assets/sources/MINTMANGA.png';
import multporn from '../../../assets/sources/MULTPORN.png';
import nudemoon from '../../../assets/sources/NUDEMOON.png';
import puremanga from '../../../assets/sources/PUREMANGA.png';
import readmangaRu from '../../../assets/sources/READMANGA_RU.png';
import remanga from '../../../assets/sources/REMANGA.png';
import seimanga from '../../../assets/sources/SEIMANGA.png';
import selfmanga from '../../../assets/sources/SELFMANGA.png';
import senkuro from '../../../assets/sources/SENKURO.png';
import sexkomix2 from '../../../assets/sources/SEXKOMIX2.png';
import tomilolib from '../../../assets/sources/TOMILOLIB.png';
import usagi from '../../../assets/sources/USAGI.png';
import wamanga from '../../../assets/sources/WAMANGA.png';
import yaoilib from '../../../assets/sources/YAOILIB.png';

const getPropsBySourceId = (
  id: SourceId,
): { initials: string; src?: string; style?: MantineStyleProp } => {
  switch (id) {
    case SOURCE_ID.READMANGA_RU:
      return {
        initials: 'RM',
        src: readmangaRu,
      };
    case SOURCE_ID.MINTMANGA:
      return {
        initials: 'MM',
        src: mintmanga,
      };
    case SOURCE_ID.SELFMANGA:
      return {
        initials: 'SM',
        src: selfmanga,
      };
    case SOURCE_ID.SEIMANGA:
      return {
        initials: 'SI',
        src: seimanga,
      };
    case SOURCE_ID.USAGI:
      return {
        initials: 'US',
        src: usagi,
      };
    case SOURCE_ID.ALLHENTAI:
      return {
        initials: 'AH',
        src: allhentai,
      };
    case SOURCE_ID.DESUME:
      return {
        initials: 'DU',
        src: desume,
      };
    case SOURCE_ID.MANGALIB:
      return {
        initials: 'ML',
        src: mangalib,
      };
    case SOURCE_ID.HENTAILIB:
      return {
        initials: 'HL',
        src: hentailib,
      };
    case SOURCE_ID.YAOILIB:
      return {
        initials: 'YL',
        src: yaoilib,
      };
    case SOURCE_ID.MANGACHAN:
      return {
        initials: 'MC',
        src: mangachan,
      };
    case SOURCE_ID.REMANGA:
      return {
        initials: 'РЕ',
        src: remanga,
      };
    case SOURCE_ID.NUDEMOON:
      return {
        initials: 'NM',
        src: nudemoon,
        style: { backgroundColor: '#fff' },
      };
    case SOURCE_ID.ACOMICS:
      return {
        initials: 'AC',
        src: acomics,
      };
    case SOURCE_ID.COMX:
      return {
        initials: 'CX',
        src: comx,
      };
    case SOURCE_ID.MANGABUFF:
      return {
        initials: 'MB',
        src: mangabuff,
        style: { backgroundColor: '#8805ff' },
      };
    case SOURCE_ID.SENKURO:
      return {
        initials: 'SK',
        src: senkuro,
        style: { backgroundColor: '#f8710e' },
      };
    case SOURCE_ID.SENKOGNITO:
      return {
        initials: 'SG',
        src: senkuro,
        style: { backgroundColor: '#f8710e' },
      };
    case SOURCE_ID.TOMILOLIB:
      return {
        initials: 'TL',
        src: tomilolib,
      };
    case SOURCE_ID.WAMANGA:
      return {
        initials: 'WM',
        src: wamanga,
        style: { backgroundColor: '#151515' },
      };
    case SOURCE_ID.INKSTORY:
      return {
        initials: 'IN',
        src: inkstory,
      };
    case SOURCE_ID.PUREMANGA:
      return {
        initials: 'PM',
        src: puremanga,
      };
    case SOURCE_ID.HENTAICHAN_CC:
      return {
        initials: 'HC',
        src: hentaichanCc,
      };
    case SOURCE_ID.SEXKOMIX2:
      return {
        initials: 'SX',
        src: sexkomix2,
      };
    case SOURCE_ID.MULTPORN:
      return {
        initials: 'MP',
        src: multporn,
        style: { backgroundColor: '#fff' },
      };
    case SOURCE_ID.MULTPORN_HENTAI:
      return {
        initials: 'MH',
        src: multporn,
        style: { backgroundColor: '#fff' },
      };
    case SOURCE_ID.HENCHAN:
      return {
        initials: 'ХТ',
      };
    case SOURCE_ID.YAOICHAN:
      return {
        initials: 'ЯТ',
      };
  }
};

type Props = Pick<Source, 'id' | 'title'> & Omit<AvatarProps, 'src' | 'name' | 'color' | 'style'>;

function SourceIcon({ id, title, size = 40, ...restProps }: Props) {
  const { src, initials, style } = getPropsBySourceId(id as SourceId);

  return (
    <Avatar
      src={src}
      name={title}
      color="initials"
      size={size}
      alt={title}
      style={style}
      {...restProps}
    >
      {initials}
    </Avatar>
  );
}

export default SourceIcon;
