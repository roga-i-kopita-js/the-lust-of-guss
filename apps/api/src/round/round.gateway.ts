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
import { Round } from "../entities/Round.entity";

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

  @OnEvent("round.hit")
  onRoundHit(payload: HitInfo) {
    this.server.emit("round.hit", payload);
  }

  @OnEvent("round.create")
  onRoundCreate(payload: Round) {
    this.server.emit("round.create", payload);
  }
}
