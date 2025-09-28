import { AppService } from "./app.service";

export class AppController {
  constructor(private readonly appService: AppService) {}

  getHello(): string {
    return this.appService.getHello();
  }
}