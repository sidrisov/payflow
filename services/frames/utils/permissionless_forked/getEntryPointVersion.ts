import { getEntryPointVersion } from "permissionless";
import { EntryPoint, UserOperation } from "permissionless/types";

export function isUserOperationVersion06(
  entryPoint: EntryPoint,
  _operation: UserOperation<'v0.6'> | UserOperation<'v0.7'>
): _operation is UserOperation<'v0.6'> {
  return getEntryPointVersion(entryPoint) === 'v0.6';
}

// Type predicate to check if the UserOperation is V07.
export function isUserOperationVersion07(
  entryPoint: EntryPoint,
  _operation: UserOperation<'v0.6'> | UserOperation<'v0.7'>
): _operation is UserOperation<'v0.7'> {
  return getEntryPointVersion(entryPoint) === 'v0.7';
}
