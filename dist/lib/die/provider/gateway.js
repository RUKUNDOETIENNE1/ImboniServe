"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPdf = isPdf;
exports.isImage = isImage;
function isPdf(mime) {
    return mime === 'application/pdf';
}
function isImage(mime) {
    return mime.startsWith('image/');
}
