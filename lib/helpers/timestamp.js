"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.relativeTimestamp = void 0;
function relativeTimestamp(timestamp) {
    return `<t:${Math.round(((typeof timestamp === "number") ? timestamp : timestamp.getTime()) / 1000)}:R>`;
}
exports.relativeTimestamp = relativeTimestamp;
//# sourceMappingURL=timestamp.js.map