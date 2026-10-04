// Both bases are plain `oc`: no procedure declares errors or meta, so every error a handler
// throws reaches clients as `defined: false`. The names say which kind each procedure is:
// `publicBase` needs no session; `protectedBase` implementers apply
// `os.<feature>.use(requireSession)`, which answers UNAUTHORIZED before input validation.
export { oc as protectedBase, oc as publicBase } from "@orpc/contract";
