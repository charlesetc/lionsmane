import { table } from "./kv.js";

export const Users = table("users", ["email"]);
export const Discussions = table("discussions", []);
export const Comments = table("comments", ["discussion"]);
