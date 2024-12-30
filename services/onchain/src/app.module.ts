import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { WalletController } from './wallet.controller';
import { AppService } from './app.service';

@Module({
  imports: [],
  controllers: [AppController, WalletController],
  providers: [AppService]
})
export class AppModule {}
