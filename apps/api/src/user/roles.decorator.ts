import { SetMetadata } from "@nestjs/common";
import { Permission } from "../entities/Permission.entity";

export type RoleArray = Array<{ action: Permission["action"]; entity: string }>;
export const ROLES_KEY = "roles_decorator";
export const Roles = (...roles: RoleArray) => SetMetadata(ROLES_KEY, roles);
