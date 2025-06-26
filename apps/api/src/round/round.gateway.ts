import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server } from "socket.io";
import { RoundService } from "./round.service";
import { PlayRound } from "./round.validator";
import { Roles } from "../user/roles.decorator";
import { SocketWithToken, WsAuthGuard } from "../user/ws-auth.guard";
import { HitInfo } from "./round.service";
import { UseGuards } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

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
    return await this.roundService.hit(data.id, client.data.tokenMeta);
  }

  @OnEvent("round")
  @Roles({ action: "read", entity: "round" })
  onRoundHit(payload: HitInfo): void {
    this.server.emit("round", payload);
  }

  @OnEvent("round.create")
  @Roles({ action: "read", entity: "round" })
  onRoundCreate(payload: HitInfo): void {
    this.server.emit("round.create", payload);
  }
}
