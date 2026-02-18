"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Result = void 0;
exports.Result = {
    ok: (value) => ({ success: true, value }),
    fail: (error) => ({ success: false, error }),
};
