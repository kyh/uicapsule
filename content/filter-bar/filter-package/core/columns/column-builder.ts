import type {
  ColumnConfig,
  ColumnDataType,
  ColumnMeta,
  ColumnOption,
  OrderDirection,
  TAccessorFn,
  TBuiltInOrderFnName,
  TCustomOrderFn,
  TOrderFnArg,
  TOrderFns,
  TTransformOptionsFn,
  TTransformValueToOptionFn,
} from "../types";
import { isAnyOf } from "../../lib/array";
import {
  isBuiltInOrderFnName,
  isBuiltInOrderFnTuple,
  isCustomOrderFn,
  isOrderDirection,
  orderFns,
} from "../../lib/order-fns";

export class ColumnConfigBuilder<
  TData,
  TType extends ColumnDataType = any,
  TVal = unknown,
  TId extends string = string,
> {
  private config: Partial<ColumnConfig<TData, TType, TVal, TId>>;

  constructor(private readonly columnType: TType) {
    this.config = { type: columnType };
  }

  private clone(): ColumnConfigBuilder<TData, TType, TVal, TId> {
    const newInstance = new ColumnConfigBuilder<TData, TType, TVal, TId>(this.columnType);
    newInstance.config = { ...this.config };
    return newInstance;
  }

  id<TNewId extends string>(value: TNewId): ColumnConfigBuilder<TData, TType, TVal, TNewId> {
    const newInstance = new ColumnConfigBuilder<TData, TType, TVal, TNewId>(this.columnType);
    newInstance.config = { ...this.config, id: value };
    return newInstance;
  }

  accessor<TNewVal>(
    accessor: TAccessorFn<TData, TNewVal>,
  ): ColumnConfigBuilder<TData, TType, TNewVal, TId> {
    const newInstance = new ColumnConfigBuilder<TData, TType, TNewVal, TId>(this.columnType);
    // SAFETY: re-keys the builder's TVal generic. The only carried field
    // mentioning TVal is transformValueToOptionFn, which the fluent API sets
    // after accessor(), and validateType guards it at runtime.
    newInstance.config = { ...this.config, accessor } as Partial<
      ColumnConfig<TData, TType, TNewVal, TId>
    >;
    return newInstance;
  }

  displayName(value: string): ColumnConfigBuilder<TData, TType, TVal, TId> {
    const newInstance = this.clone();
    newInstance.config.displayName = value;
    return newInstance;
  }

  icon(value: any): ColumnConfigBuilder<TData, TType, TVal, TId> {
    const newInstance = this.clone();
    newInstance.config.icon = value;
    return newInstance;
  }

  hidden(value: boolean): ColumnConfigBuilder<TData, TType, TVal, TId> {
    const newInstance = this.clone();
    newInstance.config.hidden = value;
    return newInstance;
  }

  // Number-specific methods
  min(value: TType extends "number" ? number : TType extends "bigint" ? bigint : never): this {
    this.validateType(["number", "bigint"], "min()");
    this.config.min = value;
    return this;
  }

  max(value: TType extends "number" ? number : TType extends "bigint" ? bigint : never): this {
    this.validateType(["number", "bigint"], "max()");
    this.config.max = value;
    return this;
  }

  // Option-specific methods
  options(value: ColumnOption[]): this {
    this.validateType(["option", "multiOption"], "options()");
    // SAFETY: validateType threw unless this is an option-based column, where
    // the conditional field type resolves to ColumnOption[].
    this.config.options = value as ColumnConfig<TData, TType, TVal, TId>["options"];
    return this;
  }

  transformValueToOptionFn(fn: TTransformValueToOptionFn<TVal>): this {
    this.validateType(["option", "multiOption"], "transformValueToOptionFn()");
    // SAFETY: validateType threw unless this is an option-based column, where
    // the conditional field type resolves to TTransformValueToOptionFn<TVal>.
    this.config.transformValueToOptionFn = fn as ColumnConfig<
      TData,
      TType,
      TVal,
      TId
    >["transformValueToOptionFn"];
    return this;
  }

  /**
   * Transforms the computed column options after initial computation, with access to faceted data.
   * This is applied AFTER transformValueToOptionFn and has access to both the computed options array
   * and faceted unique values data.
   *
   * @param fn - Function that receives the computed options and faceted data, returns transformed options
   */
  transformOptionsFn(fn: TTransformOptionsFn): this {
    this.validateType(["option", "multiOption"], "transformOptionsFn()");
    // SAFETY: validateType threw unless this is an option-based column, where
    // the conditional field type resolves to TTransformOptionsFn.
    this.config.transformOptionsFn = fn as ColumnConfig<
      TData,
      TType,
      TVal,
      TId
    >["transformOptionsFn"];
    return this;
  }

  orderFn(name: TBuiltInOrderFnName, direction: OrderDirection): this;
  orderFn(customFn: TCustomOrderFn): this;
  orderFn(...args: TOrderFnArg[]): this;
  orderFn(...args: any[]): this {
    this.validateType(["option", "multiOption"], "orderFn()");

    const orderFnsToApply: TOrderFns = [];

    // Handle the case where first two args are built-in name and direction
    if (args.length === 2 && isBuiltInOrderFnName(args[0]) && isOrderDirection(args[1])) {
      const [name, direction] = args;
      orderFnsToApply.push((a: ColumnOption, b: ColumnOption) => orderFns[name](a, b, direction));
    } else if (args.length === 1 && isCustomOrderFn(args[0])) {
      orderFnsToApply.push(args[0]);
    } else {
      // Handle array/rest syntax - validate each argument
      for (const arg of args) {
        if (isBuiltInOrderFnTuple(arg)) {
          const [name, direction] = arg;
          orderFnsToApply.push((a: ColumnOption, b: ColumnOption) =>
            orderFns[name](a, b, direction),
          );
        } else if (isCustomOrderFn(arg)) {
          orderFnsToApply.push(arg);
        } else {
          throw new Error(
            `Invalid argument: ${JSON.stringify(arg)}. Expected built-in function tuple or custom function.`,
          );
        }
      }
    }

    // SAFETY: validateType threw unless this is an option-based column, where
    // the conditional field type resolves to TOrderFns.
    this.config.orderFn = orderFnsToApply as ColumnConfig<TData, TType, TVal, TId>["orderFn"];
    return this;
  }

  toggledStateName(
    value: string,
  ): ColumnConfigBuilder<TData, TType extends "boolean" ? TType : never, TVal, TId> {
    if (this.config.type !== "boolean")
      throw new Error("toggledStateName() is only applicable to boolean columns");

    // SAFETY: the guard above threw unless the column type is "boolean";
    // widening the builder lets the boolean-only conditional field be set.
    const newInstance = this.clone() as ColumnConfigBuilder<any, any, any, any>;
    newInstance.config.toggledStateName = value;
    return newInstance;
  }

  meta(value: ColumnMeta): ColumnConfigBuilder<TData, TType, TVal, TId> {
    const newInstance = this.clone();
    newInstance.config.meta = value;
    return newInstance;
  }

  private validateType(expectedTypes: ColumnDataType | ColumnDataType[], methodName: string) {
    const types = Array.isArray(expectedTypes) ? expectedTypes : [expectedTypes];
    if (!isAnyOf(this.config.type, types)) {
      throw new Error(
        `[Column config builder] ${methodName} is only applicable to ${types.join(" or ")} columns`,
      );
    }
  }

  build(): ColumnConfig<TData, TType, TVal, TId> {
    this.validateRequiredFields();
    // SAFETY: validateRequiredFields threw unless id, accessor, and displayName
    // are present; type is always set by the constructor.
    return this.config as ColumnConfig<TData, TType, TVal, TId>;
  }

  private validateRequiredFields() {
    if (!this.config.id) throw new Error("id is required");
    if (!this.config.accessor) throw new Error("accessor is required");
    if (!this.config.displayName) throw new Error("displayName is required");
  }
}

// Update the helper interface
interface FluentColumnConfigHelper<TData> {
  text: () => ColumnConfigBuilder<TData, "text", string>;
  number: () => ColumnConfigBuilder<TData, "number", number>;
  bigint: () => ColumnConfigBuilder<TData, "bigint", bigint>;
  date: () => ColumnConfigBuilder<TData, "date", Date>;
  boolean: () => ColumnConfigBuilder<TData, "boolean", boolean>;
  option: () => ColumnConfigBuilder<TData, "option", string>;
  multiOption: () => ColumnConfigBuilder<TData, "multiOption", string[]>;
}

// Factory function remains mostly the same
export function createColumnConfigHelper<TData>(): FluentColumnConfigHelper<TData> {
  return {
    text: () => new ColumnConfigBuilder<TData, "text", string>("text"),
    number: () => new ColumnConfigBuilder<TData, "number", number>("number"),
    bigint: () => new ColumnConfigBuilder<TData, "bigint", bigint>("bigint"),
    date: () => new ColumnConfigBuilder<TData, "date", Date>("date"),
    boolean: () => new ColumnConfigBuilder<TData, "boolean", boolean>("boolean"),
    option: () => new ColumnConfigBuilder<TData, "option", string>("option"),
    multiOption: () => new ColumnConfigBuilder<TData, "multiOption", string[]>("multiOption"),
  };
}
