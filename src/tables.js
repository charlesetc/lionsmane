import { table } from "./kv.js";

export const Users = table("users", "id", ["email"]);
export const Discussions = table("discussions", "id", []);
export const Comments = table("comments", "id", ["discussion"]);
