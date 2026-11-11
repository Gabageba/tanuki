import { Module } from '@nestjs/common';
import { ParsersClientModule } from '../parsers-client/parsers-client.module';
import { UPSTREAM_POLICY, createUpstreamPolicy } from './upstream-policy';
import { ImgProxyController } from './img-proxy.controller';

@Module({
  imports: [ParsersClientModule],
  providers: [{ provide: UPSTREAM_POLICY, useFactory: createUpstreamPolicy }],
  controllers: [ImgProxyController],
})
export class ImgProxyModule {}
