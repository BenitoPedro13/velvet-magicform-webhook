import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebhookController } from './webhooks/webhook.controller';
@Module({
  imports: [],
  controllers: [AppController, WebhookController],
  providers: [AppService],
})
export class AppModule {}
