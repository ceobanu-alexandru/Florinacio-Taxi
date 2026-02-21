import { request } from "./client";

export function getUserByPhoneNumber(phoneNumber) {
    return request(`/users?phoneNumber=${encodeURIComponent(phoneNumber)}`); 
}

export function getUsers() {
  return request("/api/users");
}