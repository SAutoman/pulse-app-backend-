import { User } from "@prisma/client";
import { Request } from "express";

export interface ICustomRequest extends Request {
  authenticatedUser: User; // or any other type
}