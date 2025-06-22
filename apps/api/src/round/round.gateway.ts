// src/round/round.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server } from "socket.io";
import { RoundService } from "./round.service";
import { PlayRound, RoundListOptions } from "./round.validator";
import { Roles } from "../user/roles.decorator";
import { SocketWithToken, WsAuthGuard } from "../user/ws-auth.guard";
import { HitInfo } from "./round.service";
import { UseGuards } from "@nestjs/common";

@WebSocketGateway({ namespace: "/rounds", cors: true })
@UseGuards(WsAuthGuard)
export class RoundGateway {
  @WebSocketServer() server: Server;

  constructor(private readonly roundService: RoundService) {}

  @SubscribeMessage("play")
  @Roles({ action: "update", entity: "round" })
  async handlePlay(
    @MessageBody() data: PlayRound,
    @ConnectedSocket()
    client: SocketWithToken,
  ): Promise<HitInfo> {
    const info = await this.roundService.hit(data.id, client.data.tokenMeta);

    this.server.to(data.id).emit("update", info);
    if (info.flushed) {
      this.server.to(data.id).emit("finished", info);
    }
    return info;
  }

  @SubscribeMessage("list")
  @Roles({ action: "read", entity: "round" })
  async handleList(@MessageBody() options: RoundListOptions) {
    return this.roundService.getRoundList(options);
  }
}
