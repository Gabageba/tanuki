import { Module } from '@nestjs/common';
import { ParsersClientModule } from '../parsers-client/parsers-client.module';
import { ImgProxyController } from './img-proxy.controller';

@Module({
  imports: [ParsersClientModule],
  controllers: [ImgProxyController],
})
export class ImgProxyModule {}
