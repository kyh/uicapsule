import type {
  InferContractRouterInputs,
  InferContractRouterOutputs,
  RouterContractClient,
} from "@orpc/contract";

import { requestContract } from "./request/request-contract";
import { ugcContract } from "./ugc/ugc-contract";
import { userContract } from "./user/user-contract";

/** The API's single source of truth: @repo/service implements it, clients type against it. */
export const contract = {
  request: requestContract,
  ugc: ugcContract,
  user: userContract,
};

export type Contract = typeof contract;

export type ContractClient = RouterContractClient<Contract>;

export type RouterInputs = InferContractRouterInputs<Contract>;

export type RouterOutputs = InferContractRouterOutputs<Contract>;
