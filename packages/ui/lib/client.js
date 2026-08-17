window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-client-ui-x402",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region \0rolldown/runtime.js
		var __create = Object.create;
		var __defProp = Object.defineProperty;
		var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
		var __getOwnPropNames = Object.getOwnPropertyNames;
		var __getProtoOf = Object.getPrototypeOf;
		var __hasOwnProp = Object.prototype.hasOwnProperty;
		var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
		var __copyProps = (to, from, except, desc) => {
			if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
				key = keys[i];
				if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
					get: ((k) => from[k]).bind(null, key),
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
				});
			}
			return to;
		};
		var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
			value: mod,
			enumerable: true
		}) : target, mod));
		//#endregion
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		react = __toESM(react, 1);
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let _deepseek_ai_dsh_client_runtime_client = require("@deepseek-ai/dsh-client-runtime/client");
		//#region ../../../node_modules/.pnpm/prop-types@15.8.1/node_modules/prop-types/lib/ReactPropTypesSecret.js
		/**
		* Copyright (c) 2013-present, Facebook, Inc.
		*
		* This source code is licensed under the MIT license found in the
		* LICENSE file in the root directory of this source tree.
		*/
		var require_ReactPropTypesSecret = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			module.exports = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
		}));
		//#endregion
		//#region ../../../node_modules/.pnpm/prop-types@15.8.1/node_modules/prop-types/factoryWithThrowingShims.js
		/**
		* Copyright (c) 2013-present, Facebook, Inc.
		*
		* This source code is licensed under the MIT license found in the
		* LICENSE file in the root directory of this source tree.
		*/
		var require_factoryWithThrowingShims = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			var ReactPropTypesSecret = require_ReactPropTypesSecret();
			function emptyFunction() {}
			function emptyFunctionWithReset() {}
			emptyFunctionWithReset.resetWarningCache = emptyFunction;
			module.exports = function() {
				function shim(props, propName, componentName, location, propFullName, secret) {
					if (secret === ReactPropTypesSecret) return;
					var err = /* @__PURE__ */ new Error("Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types");
					err.name = "Invariant Violation";
					throw err;
				}
				shim.isRequired = shim;
				function getShim() {
					return shim;
				}
				var ReactPropTypes = {
					array: shim,
					bigint: shim,
					bool: shim,
					func: shim,
					number: shim,
					object: shim,
					string: shim,
					symbol: shim,
					any: shim,
					arrayOf: getShim,
					element: shim,
					elementType: shim,
					instanceOf: getShim,
					node: shim,
					objectOf: getShim,
					oneOf: getShim,
					oneOfType: getShim,
					shape: getShim,
					exact: getShim,
					checkPropTypes: emptyFunctionWithReset,
					resetWarningCache: emptyFunction
				};
				ReactPropTypes.PropTypes = ReactPropTypes;
				return ReactPropTypes;
			};
		}));
		//#endregion
		//#region ../../../node_modules/.pnpm/qrcode-generator@2.0.4/node_modules/qrcode-generator/dist/qrcode.mjs
		var import_prop_types = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
			module.exports = require_factoryWithThrowingShims()();
		})))(), 1);
		/**
		* qrcode
		* @param typeNumber 1 to 40
		* @param errorCorrectionLevel 'L','M','Q','H'
		*/
		const qrcode = function(typeNumber, errorCorrectionLevel) {
			const PAD0 = 236;
			const PAD1 = 17;
			let _typeNumber = typeNumber;
			const _errorCorrectionLevel = QRErrorCorrectionLevel[errorCorrectionLevel];
			let _modules = null;
			let _moduleCount = 0;
			let _dataCache = null;
			const _dataList = [];
			const _this = {};
			const makeImpl = function(test, maskPattern) {
				_moduleCount = _typeNumber * 4 + 17;
				_modules = function(moduleCount) {
					const modules = new Array(moduleCount);
					for (let row = 0; row < moduleCount; row += 1) {
						modules[row] = new Array(moduleCount);
						for (let col = 0; col < moduleCount; col += 1) modules[row][col] = null;
					}
					return modules;
				}(_moduleCount);
				setupPositionProbePattern(0, 0);
				setupPositionProbePattern(_moduleCount - 7, 0);
				setupPositionProbePattern(0, _moduleCount - 7);
				setupPositionAdjustPattern();
				setupTimingPattern();
				setupTypeInfo(test, maskPattern);
				if (_typeNumber >= 7) setupTypeNumber(test);
				if (_dataCache == null) _dataCache = createData(_typeNumber, _errorCorrectionLevel, _dataList);
				mapData(_dataCache, maskPattern);
			};
			const setupPositionProbePattern = function(row, col) {
				for (let r = -1; r <= 7; r += 1) {
					if (row + r <= -1 || _moduleCount <= row + r) continue;
					for (let c = -1; c <= 7; c += 1) {
						if (col + c <= -1 || _moduleCount <= col + c) continue;
						if (0 <= r && r <= 6 && (c == 0 || c == 6) || 0 <= c && c <= 6 && (r == 0 || r == 6) || 2 <= r && r <= 4 && 2 <= c && c <= 4) _modules[row + r][col + c] = true;
						else _modules[row + r][col + c] = false;
					}
				}
			};
			const getBestMaskPattern = function() {
				let minLostPoint = 0;
				let pattern = 0;
				for (let i = 0; i < 8; i += 1) {
					makeImpl(true, i);
					const lostPoint = QRUtil.getLostPoint(_this);
					if (i == 0 || minLostPoint > lostPoint) {
						minLostPoint = lostPoint;
						pattern = i;
					}
				}
				return pattern;
			};
			const setupTimingPattern = function() {
				for (let r = 8; r < _moduleCount - 8; r += 1) {
					if (_modules[r][6] != null) continue;
					_modules[r][6] = r % 2 == 0;
				}
				for (let c = 8; c < _moduleCount - 8; c += 1) {
					if (_modules[6][c] != null) continue;
					_modules[6][c] = c % 2 == 0;
				}
			};
			const setupPositionAdjustPattern = function() {
				const pos = QRUtil.getPatternPosition(_typeNumber);
				for (let i = 0; i < pos.length; i += 1) for (let j = 0; j < pos.length; j += 1) {
					const row = pos[i];
					const col = pos[j];
					if (_modules[row][col] != null) continue;
					for (let r = -2; r <= 2; r += 1) for (let c = -2; c <= 2; c += 1) if (r == -2 || r == 2 || c == -2 || c == 2 || r == 0 && c == 0) _modules[row + r][col + c] = true;
					else _modules[row + r][col + c] = false;
				}
			};
			const setupTypeNumber = function(test) {
				const bits = QRUtil.getBCHTypeNumber(_typeNumber);
				for (let i = 0; i < 18; i += 1) {
					const mod = !test && (bits >> i & 1) == 1;
					_modules[Math.floor(i / 3)][i % 3 + _moduleCount - 8 - 3] = mod;
				}
				for (let i = 0; i < 18; i += 1) {
					const mod = !test && (bits >> i & 1) == 1;
					_modules[i % 3 + _moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
				}
			};
			const setupTypeInfo = function(test, maskPattern) {
				const data = _errorCorrectionLevel << 3 | maskPattern;
				const bits = QRUtil.getBCHTypeInfo(data);
				for (let i = 0; i < 15; i += 1) {
					const mod = !test && (bits >> i & 1) == 1;
					if (i < 6) _modules[i][8] = mod;
					else if (i < 8) _modules[i + 1][8] = mod;
					else _modules[_moduleCount - 15 + i][8] = mod;
				}
				for (let i = 0; i < 15; i += 1) {
					const mod = !test && (bits >> i & 1) == 1;
					if (i < 8) _modules[8][_moduleCount - i - 1] = mod;
					else if (i < 9) _modules[8][15 - i - 1 + 1] = mod;
					else _modules[8][15 - i - 1] = mod;
				}
				_modules[_moduleCount - 8][8] = !test;
			};
			const mapData = function(data, maskPattern) {
				let inc = -1;
				let row = _moduleCount - 1;
				let bitIndex = 7;
				let byteIndex = 0;
				const maskFunc = QRUtil.getMaskFunction(maskPattern);
				for (let col = _moduleCount - 1; col > 0; col -= 2) {
					if (col == 6) col -= 1;
					while (true) {
						for (let c = 0; c < 2; c += 1) if (_modules[row][col - c] == null) {
							let dark = false;
							if (byteIndex < data.length) dark = (data[byteIndex] >>> bitIndex & 1) == 1;
							if (maskFunc(row, col - c)) dark = !dark;
							_modules[row][col - c] = dark;
							bitIndex -= 1;
							if (bitIndex == -1) {
								byteIndex += 1;
								bitIndex = 7;
							}
						}
						row += inc;
						if (row < 0 || _moduleCount <= row) {
							row -= inc;
							inc = -inc;
							break;
						}
					}
				}
			};
			const createBytes = function(buffer, rsBlocks) {
				let offset = 0;
				let maxDcCount = 0;
				let maxEcCount = 0;
				const dcdata = new Array(rsBlocks.length);
				const ecdata = new Array(rsBlocks.length);
				for (let r = 0; r < rsBlocks.length; r += 1) {
					const dcCount = rsBlocks[r].dataCount;
					const ecCount = rsBlocks[r].totalCount - dcCount;
					maxDcCount = Math.max(maxDcCount, dcCount);
					maxEcCount = Math.max(maxEcCount, ecCount);
					dcdata[r] = new Array(dcCount);
					for (let i = 0; i < dcdata[r].length; i += 1) dcdata[r][i] = 255 & buffer.getBuffer()[i + offset];
					offset += dcCount;
					const rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
					const modPoly = qrPolynomial(dcdata[r], rsPoly.getLength() - 1).mod(rsPoly);
					ecdata[r] = new Array(rsPoly.getLength() - 1);
					for (let i = 0; i < ecdata[r].length; i += 1) {
						const modIndex = i + modPoly.getLength() - ecdata[r].length;
						ecdata[r][i] = modIndex >= 0 ? modPoly.getAt(modIndex) : 0;
					}
				}
				let totalCodeCount = 0;
				for (let i = 0; i < rsBlocks.length; i += 1) totalCodeCount += rsBlocks[i].totalCount;
				const data = new Array(totalCodeCount);
				let index = 0;
				for (let i = 0; i < maxDcCount; i += 1) for (let r = 0; r < rsBlocks.length; r += 1) if (i < dcdata[r].length) {
					data[index] = dcdata[r][i];
					index += 1;
				}
				for (let i = 0; i < maxEcCount; i += 1) for (let r = 0; r < rsBlocks.length; r += 1) if (i < ecdata[r].length) {
					data[index] = ecdata[r][i];
					index += 1;
				}
				return data;
			};
			const createData = function(typeNumber, errorCorrectionLevel, dataList) {
				const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectionLevel);
				const buffer = qrBitBuffer();
				for (let i = 0; i < dataList.length; i += 1) {
					const data = dataList[i];
					buffer.put(data.getMode(), 4);
					buffer.put(data.getLength(), QRUtil.getLengthInBits(data.getMode(), typeNumber));
					data.write(buffer);
				}
				let totalDataCount = 0;
				for (let i = 0; i < rsBlocks.length; i += 1) totalDataCount += rsBlocks[i].dataCount;
				if (buffer.getLengthInBits() > totalDataCount * 8) throw "code length overflow. (" + buffer.getLengthInBits() + ">" + totalDataCount * 8 + ")";
				if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) buffer.put(0, 4);
				while (buffer.getLengthInBits() % 8 != 0) buffer.putBit(false);
				while (true) {
					if (buffer.getLengthInBits() >= totalDataCount * 8) break;
					buffer.put(PAD0, 8);
					if (buffer.getLengthInBits() >= totalDataCount * 8) break;
					buffer.put(PAD1, 8);
				}
				return createBytes(buffer, rsBlocks);
			};
			_this.addData = function(data, mode) {
				mode = mode || "Byte";
				let newData = null;
				switch (mode) {
					case "Numeric":
						newData = qrNumber(data);
						break;
					case "Alphanumeric":
						newData = qrAlphaNum(data);
						break;
					case "Byte":
						newData = qr8BitByte(data);
						break;
					case "Kanji":
						newData = qrKanji(data);
						break;
					default: throw "mode:" + mode;
				}
				_dataList.push(newData);
				_dataCache = null;
			};
			_this.isDark = function(row, col) {
				if (row < 0 || _moduleCount <= row || col < 0 || _moduleCount <= col) throw row + "," + col;
				return _modules[row][col];
			};
			_this.getModuleCount = function() {
				return _moduleCount;
			};
			_this.make = function() {
				if (_typeNumber < 1) {
					let typeNumber = 1;
					for (; typeNumber < 40; typeNumber++) {
						const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, _errorCorrectionLevel);
						const buffer = qrBitBuffer();
						for (let i = 0; i < _dataList.length; i++) {
							const data = _dataList[i];
							buffer.put(data.getMode(), 4);
							buffer.put(data.getLength(), QRUtil.getLengthInBits(data.getMode(), typeNumber));
							data.write(buffer);
						}
						let totalDataCount = 0;
						for (let i = 0; i < rsBlocks.length; i++) totalDataCount += rsBlocks[i].dataCount;
						if (buffer.getLengthInBits() <= totalDataCount * 8) break;
					}
					_typeNumber = typeNumber;
				}
				makeImpl(false, getBestMaskPattern());
			};
			_this.createTableTag = function(cellSize, margin) {
				cellSize = cellSize || 2;
				margin = typeof margin == "undefined" ? cellSize * 4 : margin;
				let qrHtml = "";
				qrHtml += "<table style=\"";
				qrHtml += " border-width: 0px; border-style: none;";
				qrHtml += " border-collapse: collapse;";
				qrHtml += " padding: 0px; margin: " + margin + "px;";
				qrHtml += "\">";
				qrHtml += "<tbody>";
				for (let r = 0; r < _this.getModuleCount(); r += 1) {
					qrHtml += "<tr>";
					for (let c = 0; c < _this.getModuleCount(); c += 1) {
						qrHtml += "<td style=\"";
						qrHtml += " border-width: 0px; border-style: none;";
						qrHtml += " border-collapse: collapse;";
						qrHtml += " padding: 0px; margin: 0px;";
						qrHtml += " width: " + cellSize + "px;";
						qrHtml += " height: " + cellSize + "px;";
						qrHtml += " background-color: ";
						qrHtml += _this.isDark(r, c) ? "#000000" : "#ffffff";
						qrHtml += ";";
						qrHtml += "\"/>";
					}
					qrHtml += "</tr>";
				}
				qrHtml += "</tbody>";
				qrHtml += "</table>";
				return qrHtml;
			};
			_this.createSvgTag = function(cellSize, margin, alt, title) {
				let opts = {};
				if (typeof arguments[0] == "object") {
					opts = arguments[0];
					cellSize = opts.cellSize;
					margin = opts.margin;
					alt = opts.alt;
					title = opts.title;
				}
				cellSize = cellSize || 2;
				margin = typeof margin == "undefined" ? cellSize * 4 : margin;
				alt = typeof alt === "string" ? { text: alt } : alt || {};
				alt.text = alt.text || null;
				alt.id = alt.text ? alt.id || "qrcode-description" : null;
				title = typeof title === "string" ? { text: title } : title || {};
				title.text = title.text || null;
				title.id = title.text ? title.id || "qrcode-title" : null;
				const size = _this.getModuleCount() * cellSize + margin * 2;
				let c, mc, r, mr, qrSvg = "", rect;
				rect = "l" + cellSize + ",0 0," + cellSize + " -" + cellSize + ",0 0,-" + cellSize + "z ";
				qrSvg += "<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\"";
				qrSvg += !opts.scalable ? " width=\"" + size + "px\" height=\"" + size + "px\"" : "";
				qrSvg += " viewBox=\"0 0 " + size + " " + size + "\" ";
				qrSvg += " preserveAspectRatio=\"xMinYMin meet\"";
				qrSvg += title.text || alt.text ? " role=\"img\" aria-labelledby=\"" + escapeXml([title.id, alt.id].join(" ").trim()) + "\"" : "";
				qrSvg += ">";
				qrSvg += title.text ? "<title id=\"" + escapeXml(title.id) + "\">" + escapeXml(title.text) + "</title>" : "";
				qrSvg += alt.text ? "<description id=\"" + escapeXml(alt.id) + "\">" + escapeXml(alt.text) + "</description>" : "";
				qrSvg += "<rect width=\"100%\" height=\"100%\" fill=\"white\" cx=\"0\" cy=\"0\"/>";
				qrSvg += "<path d=\"";
				for (r = 0; r < _this.getModuleCount(); r += 1) {
					mr = r * cellSize + margin;
					for (c = 0; c < _this.getModuleCount(); c += 1) if (_this.isDark(r, c)) {
						mc = c * cellSize + margin;
						qrSvg += "M" + mc + "," + mr + rect;
					}
				}
				qrSvg += "\" stroke=\"transparent\" fill=\"black\"/>";
				qrSvg += "</svg>";
				return qrSvg;
			};
			_this.createDataURL = function(cellSize, margin) {
				cellSize = cellSize || 2;
				margin = typeof margin == "undefined" ? cellSize * 4 : margin;
				const size = _this.getModuleCount() * cellSize + margin * 2;
				const min = margin;
				const max = size - margin;
				return createDataURL(size, size, function(x, y) {
					if (min <= x && x < max && min <= y && y < max) {
						const c = Math.floor((x - min) / cellSize);
						const r = Math.floor((y - min) / cellSize);
						return _this.isDark(r, c) ? 0 : 1;
					} else return 1;
				});
			};
			_this.createImgTag = function(cellSize, margin, alt) {
				cellSize = cellSize || 2;
				margin = typeof margin == "undefined" ? cellSize * 4 : margin;
				const size = _this.getModuleCount() * cellSize + margin * 2;
				let img = "";
				img += "<img";
				img += " src=\"";
				img += _this.createDataURL(cellSize, margin);
				img += "\"";
				img += " width=\"";
				img += size;
				img += "\"";
				img += " height=\"";
				img += size;
				img += "\"";
				if (alt) {
					img += " alt=\"";
					img += escapeXml(alt);
					img += "\"";
				}
				img += "/>";
				return img;
			};
			const escapeXml = function(s) {
				let escaped = "";
				for (let i = 0; i < s.length; i += 1) {
					const c = s.charAt(i);
					switch (c) {
						case "<":
							escaped += "&lt;";
							break;
						case ">":
							escaped += "&gt;";
							break;
						case "&":
							escaped += "&amp;";
							break;
						case "\"":
							escaped += "&quot;";
							break;
						default:
							escaped += c;
							break;
					}
				}
				return escaped;
			};
			const _createHalfASCII = function(margin) {
				const cellSize = 1;
				margin = typeof margin == "undefined" ? cellSize * 2 : margin;
				const size = _this.getModuleCount() * cellSize + margin * 2;
				const min = margin;
				const max = size - margin;
				let y, x, r1, r2, p;
				const blocks = {
					"██": "█",
					"█ ": "▀",
					" █": "▄",
					"  ": " "
				};
				const blocksLastLineNoMargin = {
					"██": "▀",
					"█ ": "▀",
					" █": " ",
					"  ": " "
				};
				let ascii = "";
				for (y = 0; y < size; y += 2) {
					r1 = Math.floor((y - min) / cellSize);
					r2 = Math.floor((y + 1 - min) / cellSize);
					for (x = 0; x < size; x += 1) {
						p = "█";
						if (min <= x && x < max && min <= y && y < max && _this.isDark(r1, Math.floor((x - min) / cellSize))) p = " ";
						if (min <= x && x < max && min <= y + 1 && y + 1 < max && _this.isDark(r2, Math.floor((x - min) / cellSize))) p += " ";
						else p += "█";
						ascii += margin < 1 && y + 1 >= max ? blocksLastLineNoMargin[p] : blocks[p];
					}
					ascii += "\n";
				}
				if (size % 2 && margin > 0) return ascii.substring(0, ascii.length - size - 1) + Array(size + 1).join("▀");
				return ascii.substring(0, ascii.length - 1);
			};
			_this.createASCII = function(cellSize, margin) {
				cellSize = cellSize || 1;
				if (cellSize < 2) return _createHalfASCII(margin);
				cellSize -= 1;
				margin = typeof margin == "undefined" ? cellSize * 2 : margin;
				const size = _this.getModuleCount() * cellSize + margin * 2;
				const min = margin;
				const max = size - margin;
				let y, x, r, p;
				const white = Array(cellSize + 1).join("██");
				const black = Array(cellSize + 1).join("  ");
				let ascii = "";
				let line = "";
				for (y = 0; y < size; y += 1) {
					r = Math.floor((y - min) / cellSize);
					line = "";
					for (x = 0; x < size; x += 1) {
						p = 1;
						if (min <= x && x < max && min <= y && y < max && _this.isDark(r, Math.floor((x - min) / cellSize))) p = 0;
						line += p ? white : black;
					}
					for (r = 0; r < cellSize; r += 1) ascii += line + "\n";
				}
				return ascii.substring(0, ascii.length - 1);
			};
			_this.renderTo2dContext = function(context, cellSize) {
				cellSize = cellSize || 2;
				const length = _this.getModuleCount();
				for (let row = 0; row < length; row++) for (let col = 0; col < length; col++) {
					context.fillStyle = _this.isDark(row, col) ? "black" : "white";
					context.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
				}
			};
			return _this;
		};
		qrcode.stringToBytes = function(s) {
			const bytes = [];
			for (let i = 0; i < s.length; i += 1) {
				const c = s.charCodeAt(i);
				bytes.push(c & 255);
			}
			return bytes;
		};
		/**
		* @param unicodeData base64 string of byte array.
		* [16bit Unicode],[16bit Bytes], ...
		* @param numChars
		*/
		qrcode.createStringToBytes = function(unicodeData, numChars) {
			const unicodeMap = function() {
				const bin = base64DecodeInputStream(unicodeData);
				const read = function() {
					const b = bin.read();
					if (b == -1) throw "eof";
					return b;
				};
				let count = 0;
				const unicodeMap = {};
				while (true) {
					const b0 = bin.read();
					if (b0 == -1) break;
					const b1 = read();
					const b2 = read();
					const b3 = read();
					const k = String.fromCharCode(b0 << 8 | b1);
					unicodeMap[k] = b2 << 8 | b3;
					count += 1;
				}
				if (count != numChars) throw count + " != " + numChars;
				return unicodeMap;
			}();
			const unknownChar = "?".charCodeAt(0);
			return function(s) {
				const bytes = [];
				for (let i = 0; i < s.length; i += 1) {
					const c = s.charCodeAt(i);
					if (c < 128) bytes.push(c);
					else {
						const b = unicodeMap[s.charAt(i)];
						if (typeof b == "number") if ((b & 255) == b) bytes.push(b);
						else {
							bytes.push(b >>> 8);
							bytes.push(b & 255);
						}
						else bytes.push(unknownChar);
					}
				}
				return bytes;
			};
		};
		const QRMode = {
			MODE_NUMBER: 1,
			MODE_ALPHA_NUM: 2,
			MODE_8BIT_BYTE: 4,
			MODE_KANJI: 8
		};
		const QRErrorCorrectionLevel = {
			L: 1,
			M: 0,
			Q: 3,
			H: 2
		};
		const QRMaskPattern = {
			PATTERN000: 0,
			PATTERN001: 1,
			PATTERN010: 2,
			PATTERN011: 3,
			PATTERN100: 4,
			PATTERN101: 5,
			PATTERN110: 6,
			PATTERN111: 7
		};
		const QRUtil = function() {
			const PATTERN_POSITION_TABLE = [
				[],
				[6, 18],
				[6, 22],
				[6, 26],
				[6, 30],
				[6, 34],
				[
					6,
					22,
					38
				],
				[
					6,
					24,
					42
				],
				[
					6,
					26,
					46
				],
				[
					6,
					28,
					50
				],
				[
					6,
					30,
					54
				],
				[
					6,
					32,
					58
				],
				[
					6,
					34,
					62
				],
				[
					6,
					26,
					46,
					66
				],
				[
					6,
					26,
					48,
					70
				],
				[
					6,
					26,
					50,
					74
				],
				[
					6,
					30,
					54,
					78
				],
				[
					6,
					30,
					56,
					82
				],
				[
					6,
					30,
					58,
					86
				],
				[
					6,
					34,
					62,
					90
				],
				[
					6,
					28,
					50,
					72,
					94
				],
				[
					6,
					26,
					50,
					74,
					98
				],
				[
					6,
					30,
					54,
					78,
					102
				],
				[
					6,
					28,
					54,
					80,
					106
				],
				[
					6,
					32,
					58,
					84,
					110
				],
				[
					6,
					30,
					58,
					86,
					114
				],
				[
					6,
					34,
					62,
					90,
					118
				],
				[
					6,
					26,
					50,
					74,
					98,
					122
				],
				[
					6,
					30,
					54,
					78,
					102,
					126
				],
				[
					6,
					26,
					52,
					78,
					104,
					130
				],
				[
					6,
					30,
					56,
					82,
					108,
					134
				],
				[
					6,
					34,
					60,
					86,
					112,
					138
				],
				[
					6,
					30,
					58,
					86,
					114,
					142
				],
				[
					6,
					34,
					62,
					90,
					118,
					146
				],
				[
					6,
					30,
					54,
					78,
					102,
					126,
					150
				],
				[
					6,
					24,
					50,
					76,
					102,
					128,
					154
				],
				[
					6,
					28,
					54,
					80,
					106,
					132,
					158
				],
				[
					6,
					32,
					58,
					84,
					110,
					136,
					162
				],
				[
					6,
					26,
					54,
					82,
					110,
					138,
					166
				],
				[
					6,
					30,
					58,
					86,
					114,
					142,
					170
				]
			];
			const G15 = 1335;
			const G18 = 7973;
			const G15_MASK = 21522;
			const _this = {};
			const getBCHDigit = function(data) {
				let digit = 0;
				while (data != 0) {
					digit += 1;
					data >>>= 1;
				}
				return digit;
			};
			_this.getBCHTypeInfo = function(data) {
				let d = data << 10;
				while (getBCHDigit(d) - getBCHDigit(G15) >= 0) d ^= G15 << getBCHDigit(d) - getBCHDigit(G15);
				return (data << 10 | d) ^ G15_MASK;
			};
			_this.getBCHTypeNumber = function(data) {
				let d = data << 12;
				while (getBCHDigit(d) - getBCHDigit(G18) >= 0) d ^= G18 << getBCHDigit(d) - getBCHDigit(G18);
				return data << 12 | d;
			};
			_this.getPatternPosition = function(typeNumber) {
				return PATTERN_POSITION_TABLE[typeNumber - 1];
			};
			_this.getMaskFunction = function(maskPattern) {
				switch (maskPattern) {
					case QRMaskPattern.PATTERN000: return function(i, j) {
						return (i + j) % 2 == 0;
					};
					case QRMaskPattern.PATTERN001: return function(i, j) {
						return i % 2 == 0;
					};
					case QRMaskPattern.PATTERN010: return function(i, j) {
						return j % 3 == 0;
					};
					case QRMaskPattern.PATTERN011: return function(i, j) {
						return (i + j) % 3 == 0;
					};
					case QRMaskPattern.PATTERN100: return function(i, j) {
						return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 == 0;
					};
					case QRMaskPattern.PATTERN101: return function(i, j) {
						return i * j % 2 + i * j % 3 == 0;
					};
					case QRMaskPattern.PATTERN110: return function(i, j) {
						return (i * j % 2 + i * j % 3) % 2 == 0;
					};
					case QRMaskPattern.PATTERN111: return function(i, j) {
						return (i * j % 3 + (i + j) % 2) % 2 == 0;
					};
					default: throw "bad maskPattern:" + maskPattern;
				}
			};
			_this.getErrorCorrectPolynomial = function(errorCorrectLength) {
				let a = qrPolynomial([1], 0);
				for (let i = 0; i < errorCorrectLength; i += 1) a = a.multiply(qrPolynomial([1, QRMath.gexp(i)], 0));
				return a;
			};
			_this.getLengthInBits = function(mode, type) {
				if (1 <= type && type < 10) switch (mode) {
					case QRMode.MODE_NUMBER: return 10;
					case QRMode.MODE_ALPHA_NUM: return 9;
					case QRMode.MODE_8BIT_BYTE: return 8;
					case QRMode.MODE_KANJI: return 8;
					default: throw "mode:" + mode;
				}
				else if (type < 27) switch (mode) {
					case QRMode.MODE_NUMBER: return 12;
					case QRMode.MODE_ALPHA_NUM: return 11;
					case QRMode.MODE_8BIT_BYTE: return 16;
					case QRMode.MODE_KANJI: return 10;
					default: throw "mode:" + mode;
				}
				else if (type < 41) switch (mode) {
					case QRMode.MODE_NUMBER: return 14;
					case QRMode.MODE_ALPHA_NUM: return 13;
					case QRMode.MODE_8BIT_BYTE: return 16;
					case QRMode.MODE_KANJI: return 12;
					default: throw "mode:" + mode;
				}
				else throw "type:" + type;
			};
			_this.getLostPoint = function(qrcode) {
				const moduleCount = qrcode.getModuleCount();
				let lostPoint = 0;
				for (let row = 0; row < moduleCount; row += 1) for (let col = 0; col < moduleCount; col += 1) {
					let sameCount = 0;
					const dark = qrcode.isDark(row, col);
					for (let r = -1; r <= 1; r += 1) {
						if (row + r < 0 || moduleCount <= row + r) continue;
						for (let c = -1; c <= 1; c += 1) {
							if (col + c < 0 || moduleCount <= col + c) continue;
							if (r == 0 && c == 0) continue;
							if (dark == qrcode.isDark(row + r, col + c)) sameCount += 1;
						}
					}
					if (sameCount > 5) lostPoint += 3 + sameCount - 5;
				}
				for (let row = 0; row < moduleCount - 1; row += 1) for (let col = 0; col < moduleCount - 1; col += 1) {
					let count = 0;
					if (qrcode.isDark(row, col)) count += 1;
					if (qrcode.isDark(row + 1, col)) count += 1;
					if (qrcode.isDark(row, col + 1)) count += 1;
					if (qrcode.isDark(row + 1, col + 1)) count += 1;
					if (count == 0 || count == 4) lostPoint += 3;
				}
				for (let row = 0; row < moduleCount; row += 1) for (let col = 0; col < moduleCount - 6; col += 1) if (qrcode.isDark(row, col) && !qrcode.isDark(row, col + 1) && qrcode.isDark(row, col + 2) && qrcode.isDark(row, col + 3) && qrcode.isDark(row, col + 4) && !qrcode.isDark(row, col + 5) && qrcode.isDark(row, col + 6)) lostPoint += 40;
				for (let col = 0; col < moduleCount; col += 1) for (let row = 0; row < moduleCount - 6; row += 1) if (qrcode.isDark(row, col) && !qrcode.isDark(row + 1, col) && qrcode.isDark(row + 2, col) && qrcode.isDark(row + 3, col) && qrcode.isDark(row + 4, col) && !qrcode.isDark(row + 5, col) && qrcode.isDark(row + 6, col)) lostPoint += 40;
				let darkCount = 0;
				for (let col = 0; col < moduleCount; col += 1) for (let row = 0; row < moduleCount; row += 1) if (qrcode.isDark(row, col)) darkCount += 1;
				const ratio = Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5;
				lostPoint += ratio * 10;
				return lostPoint;
			};
			return _this;
		}();
		const QRMath = function() {
			const EXP_TABLE = new Array(256);
			const LOG_TABLE = new Array(256);
			for (let i = 0; i < 8; i += 1) EXP_TABLE[i] = 1 << i;
			for (let i = 8; i < 256; i += 1) EXP_TABLE[i] = EXP_TABLE[i - 4] ^ EXP_TABLE[i - 5] ^ EXP_TABLE[i - 6] ^ EXP_TABLE[i - 8];
			for (let i = 0; i < 255; i += 1) LOG_TABLE[EXP_TABLE[i]] = i;
			const _this = {};
			_this.glog = function(n) {
				if (n < 1) throw "glog(" + n + ")";
				return LOG_TABLE[n];
			};
			_this.gexp = function(n) {
				while (n < 0) n += 255;
				while (n >= 256) n -= 255;
				return EXP_TABLE[n];
			};
			return _this;
		}();
		const qrPolynomial = function(num, shift) {
			if (typeof num.length == "undefined") throw num.length + "/" + shift;
			const _num = function() {
				let offset = 0;
				while (offset < num.length && num[offset] == 0) offset += 1;
				const _num = new Array(num.length - offset + shift);
				for (let i = 0; i < num.length - offset; i += 1) _num[i] = num[i + offset];
				return _num;
			}();
			const _this = {};
			_this.getAt = function(index) {
				return _num[index];
			};
			_this.getLength = function() {
				return _num.length;
			};
			_this.multiply = function(e) {
				const num = new Array(_this.getLength() + e.getLength() - 1);
				for (let i = 0; i < _this.getLength(); i += 1) for (let j = 0; j < e.getLength(); j += 1) num[i + j] ^= QRMath.gexp(QRMath.glog(_this.getAt(i)) + QRMath.glog(e.getAt(j)));
				return qrPolynomial(num, 0);
			};
			_this.mod = function(e) {
				if (_this.getLength() - e.getLength() < 0) return _this;
				const ratio = QRMath.glog(_this.getAt(0)) - QRMath.glog(e.getAt(0));
				const num = new Array(_this.getLength());
				for (let i = 0; i < _this.getLength(); i += 1) num[i] = _this.getAt(i);
				for (let i = 0; i < e.getLength(); i += 1) num[i] ^= QRMath.gexp(QRMath.glog(e.getAt(i)) + ratio);
				return qrPolynomial(num, 0).mod(e);
			};
			return _this;
		};
		const QRRSBlock = function() {
			const RS_BLOCK_TABLE = [
				[
					1,
					26,
					19
				],
				[
					1,
					26,
					16
				],
				[
					1,
					26,
					13
				],
				[
					1,
					26,
					9
				],
				[
					1,
					44,
					34
				],
				[
					1,
					44,
					28
				],
				[
					1,
					44,
					22
				],
				[
					1,
					44,
					16
				],
				[
					1,
					70,
					55
				],
				[
					1,
					70,
					44
				],
				[
					2,
					35,
					17
				],
				[
					2,
					35,
					13
				],
				[
					1,
					100,
					80
				],
				[
					2,
					50,
					32
				],
				[
					2,
					50,
					24
				],
				[
					4,
					25,
					9
				],
				[
					1,
					134,
					108
				],
				[
					2,
					67,
					43
				],
				[
					2,
					33,
					15,
					2,
					34,
					16
				],
				[
					2,
					33,
					11,
					2,
					34,
					12
				],
				[
					2,
					86,
					68
				],
				[
					4,
					43,
					27
				],
				[
					4,
					43,
					19
				],
				[
					4,
					43,
					15
				],
				[
					2,
					98,
					78
				],
				[
					4,
					49,
					31
				],
				[
					2,
					32,
					14,
					4,
					33,
					15
				],
				[
					4,
					39,
					13,
					1,
					40,
					14
				],
				[
					2,
					121,
					97
				],
				[
					2,
					60,
					38,
					2,
					61,
					39
				],
				[
					4,
					40,
					18,
					2,
					41,
					19
				],
				[
					4,
					40,
					14,
					2,
					41,
					15
				],
				[
					2,
					146,
					116
				],
				[
					3,
					58,
					36,
					2,
					59,
					37
				],
				[
					4,
					36,
					16,
					4,
					37,
					17
				],
				[
					4,
					36,
					12,
					4,
					37,
					13
				],
				[
					2,
					86,
					68,
					2,
					87,
					69
				],
				[
					4,
					69,
					43,
					1,
					70,
					44
				],
				[
					6,
					43,
					19,
					2,
					44,
					20
				],
				[
					6,
					43,
					15,
					2,
					44,
					16
				],
				[
					4,
					101,
					81
				],
				[
					1,
					80,
					50,
					4,
					81,
					51
				],
				[
					4,
					50,
					22,
					4,
					51,
					23
				],
				[
					3,
					36,
					12,
					8,
					37,
					13
				],
				[
					2,
					116,
					92,
					2,
					117,
					93
				],
				[
					6,
					58,
					36,
					2,
					59,
					37
				],
				[
					4,
					46,
					20,
					6,
					47,
					21
				],
				[
					7,
					42,
					14,
					4,
					43,
					15
				],
				[
					4,
					133,
					107
				],
				[
					8,
					59,
					37,
					1,
					60,
					38
				],
				[
					8,
					44,
					20,
					4,
					45,
					21
				],
				[
					12,
					33,
					11,
					4,
					34,
					12
				],
				[
					3,
					145,
					115,
					1,
					146,
					116
				],
				[
					4,
					64,
					40,
					5,
					65,
					41
				],
				[
					11,
					36,
					16,
					5,
					37,
					17
				],
				[
					11,
					36,
					12,
					5,
					37,
					13
				],
				[
					5,
					109,
					87,
					1,
					110,
					88
				],
				[
					5,
					65,
					41,
					5,
					66,
					42
				],
				[
					5,
					54,
					24,
					7,
					55,
					25
				],
				[
					11,
					36,
					12,
					7,
					37,
					13
				],
				[
					5,
					122,
					98,
					1,
					123,
					99
				],
				[
					7,
					73,
					45,
					3,
					74,
					46
				],
				[
					15,
					43,
					19,
					2,
					44,
					20
				],
				[
					3,
					45,
					15,
					13,
					46,
					16
				],
				[
					1,
					135,
					107,
					5,
					136,
					108
				],
				[
					10,
					74,
					46,
					1,
					75,
					47
				],
				[
					1,
					50,
					22,
					15,
					51,
					23
				],
				[
					2,
					42,
					14,
					17,
					43,
					15
				],
				[
					5,
					150,
					120,
					1,
					151,
					121
				],
				[
					9,
					69,
					43,
					4,
					70,
					44
				],
				[
					17,
					50,
					22,
					1,
					51,
					23
				],
				[
					2,
					42,
					14,
					19,
					43,
					15
				],
				[
					3,
					141,
					113,
					4,
					142,
					114
				],
				[
					3,
					70,
					44,
					11,
					71,
					45
				],
				[
					17,
					47,
					21,
					4,
					48,
					22
				],
				[
					9,
					39,
					13,
					16,
					40,
					14
				],
				[
					3,
					135,
					107,
					5,
					136,
					108
				],
				[
					3,
					67,
					41,
					13,
					68,
					42
				],
				[
					15,
					54,
					24,
					5,
					55,
					25
				],
				[
					15,
					43,
					15,
					10,
					44,
					16
				],
				[
					4,
					144,
					116,
					4,
					145,
					117
				],
				[
					17,
					68,
					42
				],
				[
					17,
					50,
					22,
					6,
					51,
					23
				],
				[
					19,
					46,
					16,
					6,
					47,
					17
				],
				[
					2,
					139,
					111,
					7,
					140,
					112
				],
				[
					17,
					74,
					46
				],
				[
					7,
					54,
					24,
					16,
					55,
					25
				],
				[
					34,
					37,
					13
				],
				[
					4,
					151,
					121,
					5,
					152,
					122
				],
				[
					4,
					75,
					47,
					14,
					76,
					48
				],
				[
					11,
					54,
					24,
					14,
					55,
					25
				],
				[
					16,
					45,
					15,
					14,
					46,
					16
				],
				[
					6,
					147,
					117,
					4,
					148,
					118
				],
				[
					6,
					73,
					45,
					14,
					74,
					46
				],
				[
					11,
					54,
					24,
					16,
					55,
					25
				],
				[
					30,
					46,
					16,
					2,
					47,
					17
				],
				[
					8,
					132,
					106,
					4,
					133,
					107
				],
				[
					8,
					75,
					47,
					13,
					76,
					48
				],
				[
					7,
					54,
					24,
					22,
					55,
					25
				],
				[
					22,
					45,
					15,
					13,
					46,
					16
				],
				[
					10,
					142,
					114,
					2,
					143,
					115
				],
				[
					19,
					74,
					46,
					4,
					75,
					47
				],
				[
					28,
					50,
					22,
					6,
					51,
					23
				],
				[
					33,
					46,
					16,
					4,
					47,
					17
				],
				[
					8,
					152,
					122,
					4,
					153,
					123
				],
				[
					22,
					73,
					45,
					3,
					74,
					46
				],
				[
					8,
					53,
					23,
					26,
					54,
					24
				],
				[
					12,
					45,
					15,
					28,
					46,
					16
				],
				[
					3,
					147,
					117,
					10,
					148,
					118
				],
				[
					3,
					73,
					45,
					23,
					74,
					46
				],
				[
					4,
					54,
					24,
					31,
					55,
					25
				],
				[
					11,
					45,
					15,
					31,
					46,
					16
				],
				[
					7,
					146,
					116,
					7,
					147,
					117
				],
				[
					21,
					73,
					45,
					7,
					74,
					46
				],
				[
					1,
					53,
					23,
					37,
					54,
					24
				],
				[
					19,
					45,
					15,
					26,
					46,
					16
				],
				[
					5,
					145,
					115,
					10,
					146,
					116
				],
				[
					19,
					75,
					47,
					10,
					76,
					48
				],
				[
					15,
					54,
					24,
					25,
					55,
					25
				],
				[
					23,
					45,
					15,
					25,
					46,
					16
				],
				[
					13,
					145,
					115,
					3,
					146,
					116
				],
				[
					2,
					74,
					46,
					29,
					75,
					47
				],
				[
					42,
					54,
					24,
					1,
					55,
					25
				],
				[
					23,
					45,
					15,
					28,
					46,
					16
				],
				[
					17,
					145,
					115
				],
				[
					10,
					74,
					46,
					23,
					75,
					47
				],
				[
					10,
					54,
					24,
					35,
					55,
					25
				],
				[
					19,
					45,
					15,
					35,
					46,
					16
				],
				[
					17,
					145,
					115,
					1,
					146,
					116
				],
				[
					14,
					74,
					46,
					21,
					75,
					47
				],
				[
					29,
					54,
					24,
					19,
					55,
					25
				],
				[
					11,
					45,
					15,
					46,
					46,
					16
				],
				[
					13,
					145,
					115,
					6,
					146,
					116
				],
				[
					14,
					74,
					46,
					23,
					75,
					47
				],
				[
					44,
					54,
					24,
					7,
					55,
					25
				],
				[
					59,
					46,
					16,
					1,
					47,
					17
				],
				[
					12,
					151,
					121,
					7,
					152,
					122
				],
				[
					12,
					75,
					47,
					26,
					76,
					48
				],
				[
					39,
					54,
					24,
					14,
					55,
					25
				],
				[
					22,
					45,
					15,
					41,
					46,
					16
				],
				[
					6,
					151,
					121,
					14,
					152,
					122
				],
				[
					6,
					75,
					47,
					34,
					76,
					48
				],
				[
					46,
					54,
					24,
					10,
					55,
					25
				],
				[
					2,
					45,
					15,
					64,
					46,
					16
				],
				[
					17,
					152,
					122,
					4,
					153,
					123
				],
				[
					29,
					74,
					46,
					14,
					75,
					47
				],
				[
					49,
					54,
					24,
					10,
					55,
					25
				],
				[
					24,
					45,
					15,
					46,
					46,
					16
				],
				[
					4,
					152,
					122,
					18,
					153,
					123
				],
				[
					13,
					74,
					46,
					32,
					75,
					47
				],
				[
					48,
					54,
					24,
					14,
					55,
					25
				],
				[
					42,
					45,
					15,
					32,
					46,
					16
				],
				[
					20,
					147,
					117,
					4,
					148,
					118
				],
				[
					40,
					75,
					47,
					7,
					76,
					48
				],
				[
					43,
					54,
					24,
					22,
					55,
					25
				],
				[
					10,
					45,
					15,
					67,
					46,
					16
				],
				[
					19,
					148,
					118,
					6,
					149,
					119
				],
				[
					18,
					75,
					47,
					31,
					76,
					48
				],
				[
					34,
					54,
					24,
					34,
					55,
					25
				],
				[
					20,
					45,
					15,
					61,
					46,
					16
				]
			];
			const qrRSBlock = function(totalCount, dataCount) {
				const _this = {};
				_this.totalCount = totalCount;
				_this.dataCount = dataCount;
				return _this;
			};
			const _this = {};
			const getRsBlockTable = function(typeNumber, errorCorrectionLevel) {
				switch (errorCorrectionLevel) {
					case QRErrorCorrectionLevel.L: return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];
					case QRErrorCorrectionLevel.M: return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];
					case QRErrorCorrectionLevel.Q: return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];
					case QRErrorCorrectionLevel.H: return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];
					default: return;
				}
			};
			_this.getRSBlocks = function(typeNumber, errorCorrectionLevel) {
				const rsBlock = getRsBlockTable(typeNumber, errorCorrectionLevel);
				if (typeof rsBlock == "undefined") throw "bad rs block @ typeNumber:" + typeNumber + "/errorCorrectionLevel:" + errorCorrectionLevel;
				const length = rsBlock.length / 3;
				const list = [];
				for (let i = 0; i < length; i += 1) {
					const count = rsBlock[i * 3 + 0];
					const totalCount = rsBlock[i * 3 + 1];
					const dataCount = rsBlock[i * 3 + 2];
					for (let j = 0; j < count; j += 1) list.push(qrRSBlock(totalCount, dataCount));
				}
				return list;
			};
			return _this;
		}();
		const qrBitBuffer = function() {
			const _buffer = [];
			let _length = 0;
			const _this = {};
			_this.getBuffer = function() {
				return _buffer;
			};
			_this.getAt = function(index) {
				return (_buffer[Math.floor(index / 8)] >>> 7 - index % 8 & 1) == 1;
			};
			_this.put = function(num, length) {
				for (let i = 0; i < length; i += 1) _this.putBit((num >>> length - i - 1 & 1) == 1);
			};
			_this.getLengthInBits = function() {
				return _length;
			};
			_this.putBit = function(bit) {
				const bufIndex = Math.floor(_length / 8);
				if (_buffer.length <= bufIndex) _buffer.push(0);
				if (bit) _buffer[bufIndex] |= 128 >>> _length % 8;
				_length += 1;
			};
			return _this;
		};
		const qrNumber = function(data) {
			const _mode = QRMode.MODE_NUMBER;
			const _data = data;
			const _this = {};
			_this.getMode = function() {
				return _mode;
			};
			_this.getLength = function(buffer) {
				return _data.length;
			};
			_this.write = function(buffer) {
				const data = _data;
				let i = 0;
				while (i + 2 < data.length) {
					buffer.put(strToNum(data.substring(i, i + 3)), 10);
					i += 3;
				}
				if (i < data.length) {
					if (data.length - i == 1) buffer.put(strToNum(data.substring(i, i + 1)), 4);
					else if (data.length - i == 2) buffer.put(strToNum(data.substring(i, i + 2)), 7);
				}
			};
			const strToNum = function(s) {
				let num = 0;
				for (let i = 0; i < s.length; i += 1) num = num * 10 + chatToNum(s.charAt(i));
				return num;
			};
			const chatToNum = function(c) {
				if ("0" <= c && c <= "9") return c.charCodeAt(0) - "0".charCodeAt(0);
				throw "illegal char :" + c;
			};
			return _this;
		};
		const qrAlphaNum = function(data) {
			const _mode = QRMode.MODE_ALPHA_NUM;
			const _data = data;
			const _this = {};
			_this.getMode = function() {
				return _mode;
			};
			_this.getLength = function(buffer) {
				return _data.length;
			};
			_this.write = function(buffer) {
				const s = _data;
				let i = 0;
				while (i + 1 < s.length) {
					buffer.put(getCode(s.charAt(i)) * 45 + getCode(s.charAt(i + 1)), 11);
					i += 2;
				}
				if (i < s.length) buffer.put(getCode(s.charAt(i)), 6);
			};
			const getCode = function(c) {
				if ("0" <= c && c <= "9") return c.charCodeAt(0) - "0".charCodeAt(0);
				else if ("A" <= c && c <= "Z") return c.charCodeAt(0) - "A".charCodeAt(0) + 10;
				else switch (c) {
					case " ": return 36;
					case "$": return 37;
					case "%": return 38;
					case "*": return 39;
					case "+": return 40;
					case "-": return 41;
					case ".": return 42;
					case "/": return 43;
					case ":": return 44;
					default: throw "illegal char :" + c;
				}
			};
			return _this;
		};
		const qr8BitByte = function(data) {
			const _mode = QRMode.MODE_8BIT_BYTE;
			const _bytes = qrcode.stringToBytes(data);
			const _this = {};
			_this.getMode = function() {
				return _mode;
			};
			_this.getLength = function(buffer) {
				return _bytes.length;
			};
			_this.write = function(buffer) {
				for (let i = 0; i < _bytes.length; i += 1) buffer.put(_bytes[i], 8);
			};
			return _this;
		};
		const qrKanji = function(data) {
			const _mode = QRMode.MODE_KANJI;
			const stringToBytes = qrcode.stringToBytes;
			(function(c, code) {
				const test = stringToBytes(c);
				if (test.length != 2 || (test[0] << 8 | test[1]) != code) throw "sjis not supported.";
			})("友", 38726);
			const _bytes = stringToBytes(data);
			const _this = {};
			_this.getMode = function() {
				return _mode;
			};
			_this.getLength = function(buffer) {
				return ~~(_bytes.length / 2);
			};
			_this.write = function(buffer) {
				const data = _bytes;
				let i = 0;
				while (i + 1 < data.length) {
					let c = (255 & data[i]) << 8 | 255 & data[i + 1];
					if (33088 <= c && c <= 40956) c -= 33088;
					else if (57408 <= c && c <= 60351) c -= 49472;
					else throw "illegal char at " + (i + 1) + "/" + c;
					c = (c >>> 8 & 255) * 192 + (c & 255);
					buffer.put(c, 13);
					i += 2;
				}
				if (i < data.length) throw "illegal char at " + (i + 1);
			};
			return _this;
		};
		const byteArrayOutputStream = function() {
			const _bytes = [];
			const _this = {};
			_this.writeByte = function(b) {
				_bytes.push(b & 255);
			};
			_this.writeShort = function(i) {
				_this.writeByte(i);
				_this.writeByte(i >>> 8);
			};
			_this.writeBytes = function(b, off, len) {
				off = off || 0;
				len = len || b.length;
				for (let i = 0; i < len; i += 1) _this.writeByte(b[i + off]);
			};
			_this.writeString = function(s) {
				for (let i = 0; i < s.length; i += 1) _this.writeByte(s.charCodeAt(i));
			};
			_this.toByteArray = function() {
				return _bytes;
			};
			_this.toString = function() {
				let s = "";
				s += "[";
				for (let i = 0; i < _bytes.length; i += 1) {
					if (i > 0) s += ",";
					s += _bytes[i];
				}
				s += "]";
				return s;
			};
			return _this;
		};
		const base64EncodeOutputStream = function() {
			let _buffer = 0;
			let _buflen = 0;
			let _length = 0;
			let _base64 = "";
			const _this = {};
			const writeEncoded = function(b) {
				_base64 += String.fromCharCode(encode(b & 63));
			};
			const encode = function(n) {
				if (n < 0) throw "n:" + n;
				else if (n < 26) return 65 + n;
				else if (n < 52) return 97 + (n - 26);
				else if (n < 62) return 48 + (n - 52);
				else if (n == 62) return 43;
				else if (n == 63) return 47;
				else throw "n:" + n;
			};
			_this.writeByte = function(n) {
				_buffer = _buffer << 8 | n & 255;
				_buflen += 8;
				_length += 1;
				while (_buflen >= 6) {
					writeEncoded(_buffer >>> _buflen - 6);
					_buflen -= 6;
				}
			};
			_this.flush = function() {
				if (_buflen > 0) {
					writeEncoded(_buffer << 6 - _buflen);
					_buffer = 0;
					_buflen = 0;
				}
				if (_length % 3 != 0) {
					const padlen = 3 - _length % 3;
					for (let i = 0; i < padlen; i += 1) _base64 += "=";
				}
			};
			_this.toString = function() {
				return _base64;
			};
			return _this;
		};
		const base64DecodeInputStream = function(str) {
			const _str = str;
			let _pos = 0;
			let _buffer = 0;
			let _buflen = 0;
			const _this = {};
			_this.read = function() {
				while (_buflen < 8) {
					if (_pos >= _str.length) {
						if (_buflen == 0) return -1;
						throw "unexpected end of file./" + _buflen;
					}
					const c = _str.charAt(_pos);
					_pos += 1;
					if (c == "=") {
						_buflen = 0;
						return -1;
					} else if (c.match(/^\s$/)) continue;
					_buffer = _buffer << 6 | decode(c.charCodeAt(0));
					_buflen += 6;
				}
				const n = _buffer >>> _buflen - 8 & 255;
				_buflen -= 8;
				return n;
			};
			const decode = function(c) {
				if (65 <= c && c <= 90) return c - 65;
				else if (97 <= c && c <= 122) return c - 97 + 26;
				else if (48 <= c && c <= 57) return c - 48 + 52;
				else if (c == 43) return 62;
				else if (c == 47) return 63;
				else throw "c:" + c;
			};
			return _this;
		};
		const gifImage = function(width, height) {
			const _width = width;
			const _height = height;
			const _data = new Array(width * height);
			const _this = {};
			_this.setPixel = function(x, y, pixel) {
				_data[y * _width + x] = pixel;
			};
			_this.write = function(out) {
				out.writeString("GIF87a");
				out.writeShort(_width);
				out.writeShort(_height);
				out.writeByte(128);
				out.writeByte(0);
				out.writeByte(0);
				out.writeByte(0);
				out.writeByte(0);
				out.writeByte(0);
				out.writeByte(255);
				out.writeByte(255);
				out.writeByte(255);
				out.writeString(",");
				out.writeShort(0);
				out.writeShort(0);
				out.writeShort(_width);
				out.writeShort(_height);
				out.writeByte(0);
				const lzwMinCodeSize = 2;
				const raster = getLZWRaster(lzwMinCodeSize);
				out.writeByte(lzwMinCodeSize);
				let offset = 0;
				while (raster.length - offset > 255) {
					out.writeByte(255);
					out.writeBytes(raster, offset, 255);
					offset += 255;
				}
				out.writeByte(raster.length - offset);
				out.writeBytes(raster, offset, raster.length - offset);
				out.writeByte(0);
				out.writeString(";");
			};
			const bitOutputStream = function(out) {
				const _out = out;
				let _bitLength = 0;
				let _bitBuffer = 0;
				const _this = {};
				_this.write = function(data, length) {
					if (data >>> length != 0) throw "length over";
					while (_bitLength + length >= 8) {
						_out.writeByte(255 & (data << _bitLength | _bitBuffer));
						length -= 8 - _bitLength;
						data >>>= 8 - _bitLength;
						_bitBuffer = 0;
						_bitLength = 0;
					}
					_bitBuffer = data << _bitLength | _bitBuffer;
					_bitLength = _bitLength + length;
				};
				_this.flush = function() {
					if (_bitLength > 0) _out.writeByte(_bitBuffer);
				};
				return _this;
			};
			const getLZWRaster = function(lzwMinCodeSize) {
				const clearCode = 1 << lzwMinCodeSize;
				const endCode = (1 << lzwMinCodeSize) + 1;
				let bitLength = lzwMinCodeSize + 1;
				const table = lzwTable();
				for (let i = 0; i < clearCode; i += 1) table.add(String.fromCharCode(i));
				table.add(String.fromCharCode(clearCode));
				table.add(String.fromCharCode(endCode));
				const byteOut = byteArrayOutputStream();
				const bitOut = bitOutputStream(byteOut);
				bitOut.write(clearCode, bitLength);
				let dataIndex = 0;
				let s = String.fromCharCode(_data[dataIndex]);
				dataIndex += 1;
				while (dataIndex < _data.length) {
					const c = String.fromCharCode(_data[dataIndex]);
					dataIndex += 1;
					if (table.contains(s + c)) s = s + c;
					else {
						bitOut.write(table.indexOf(s), bitLength);
						if (table.size() < 4095) {
							if (table.size() == 1 << bitLength) bitLength += 1;
							table.add(s + c);
						}
						s = c;
					}
				}
				bitOut.write(table.indexOf(s), bitLength);
				bitOut.write(endCode, bitLength);
				bitOut.flush();
				return byteOut.toByteArray();
			};
			const lzwTable = function() {
				const _map = {};
				let _size = 0;
				const _this = {};
				_this.add = function(key) {
					if (_this.contains(key)) throw "dup key:" + key;
					_map[key] = _size;
					_size += 1;
				};
				_this.size = function() {
					return _size;
				};
				_this.indexOf = function(key) {
					return _map[key];
				};
				_this.contains = function(key) {
					return typeof _map[key] != "undefined";
				};
				return _this;
			};
			return _this;
		};
		const createDataURL = function(width, height, getPixel) {
			const gif = gifImage(width, height);
			for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) gif.setPixel(x, y, getPixel(x, y));
			const b = byteArrayOutputStream();
			gif.write(b);
			const base64 = base64EncodeOutputStream();
			const bytes = b.toByteArray();
			for (let i = 0; i < bytes.length; i += 1) base64.writeByte(bytes[i]);
			base64.flush();
			return "data:image/gif;base64," + base64;
		};
		qrcode.stringToBytes;
		//#endregion
		//#region ../../../node_modules/.pnpm/react-qr-code@2.2.0_react@18.3.1/node_modules/react-qr-code/lib/index.mjs
		function _extends() {
			return _extends = Object.assign ? Object.assign.bind() : function(n) {
				for (var e = 1; e < arguments.length; e++) {
					var t = arguments[e];
					for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
				}
				return n;
			}, _extends.apply(null, arguments);
		}
		function _objectWithoutProperties(e, t) {
			if (null == e) return {};
			var o, r, i = _objectWithoutPropertiesLoose(e, t);
			if (Object.getOwnPropertySymbols) {
				var n = Object.getOwnPropertySymbols(e);
				for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]);
			}
			return i;
		}
		function _objectWithoutPropertiesLoose(r, e) {
			if (null == r) return {};
			var t = {};
			for (var n in r) if ({}.hasOwnProperty.call(r, n)) {
				if (-1 !== e.indexOf(n)) continue;
				t[n] = r[n];
			}
			return t;
		}
		var _excluded$1 = [
			"bgColor",
			"bgD",
			"fgD",
			"fgColor",
			"size",
			"title",
			"viewBoxSize",
			"xmlns"
		];
		var propTypes$1 = {
			bgColor: import_prop_types.default.oneOfType([import_prop_types.default.object, import_prop_types.default.string]).isRequired,
			bgD: import_prop_types.default.string.isRequired,
			fgColor: import_prop_types.default.oneOfType([import_prop_types.default.object, import_prop_types.default.string]).isRequired,
			fgD: import_prop_types.default.string.isRequired,
			size: import_prop_types.default.number.isRequired,
			title: import_prop_types.default.string,
			viewBoxSize: import_prop_types.default.number.isRequired,
			xmlns: import_prop_types.default.string
		};
		var QRCodeSvg = /*#__PURE__*/ (0, react.forwardRef)(function(_ref, ref) {
			var bgColor = _ref.bgColor, bgD = _ref.bgD, fgD = _ref.fgD, fgColor = _ref.fgColor, size = _ref.size, title = _ref.title, viewBoxSize = _ref.viewBoxSize, _ref$xmlns = _ref.xmlns, xmlns = _ref$xmlns === void 0 ? "http://www.w3.org/2000/svg" : _ref$xmlns, props = _objectWithoutProperties(_ref, _excluded$1);
			return /*#__PURE__*/ react.default.createElement("svg", _extends({}, props, {
				height: size,
				ref,
				viewBox: "0 0 ".concat(viewBoxSize, " ").concat(viewBoxSize),
				width: size,
				xmlns
			}), title ? /*#__PURE__*/ react.default.createElement("title", null, title) : null, /*#__PURE__*/ react.default.createElement("path", {
				d: bgD,
				fill: bgColor
			}), /*#__PURE__*/ react.default.createElement("path", {
				d: fgD,
				fill: fgColor
			}));
		});
		QRCodeSvg.displayName = "QRCodeSvg";
		QRCodeSvg.propTypes = propTypes$1;
		var _excluded = [
			"bgColor",
			"fgColor",
			"level",
			"size",
			"value"
		];
		qrcode.stringToBytes = function(s) {
			return Array.from(new TextEncoder().encode(s));
		};
		var propTypes = {
			bgColor: import_prop_types.default.oneOfType([import_prop_types.default.object, import_prop_types.default.string]),
			fgColor: import_prop_types.default.oneOfType([import_prop_types.default.object, import_prop_types.default.string]),
			level: import_prop_types.default.string,
			size: import_prop_types.default.number,
			value: import_prop_types.default.string.isRequired
		};
		var QRCode = /*#__PURE__*/ (0, react.forwardRef)(function(_ref, ref) {
			var _ref$bgColor = _ref.bgColor, bgColor = _ref$bgColor === void 0 ? "#FFFFFF" : _ref$bgColor, _ref$fgColor = _ref.fgColor, fgColor = _ref$fgColor === void 0 ? "#000000" : _ref$fgColor, _ref$level = _ref.level, level = _ref$level === void 0 ? "L" : _ref$level, _ref$size = _ref.size, size = _ref$size === void 0 ? 256 : _ref$size, value = _ref.value, props = _objectWithoutProperties(_ref, _excluded);
			var qr = qrcode(0, level);
			qr.addData(value);
			qr.make();
			var moduleCount = qr.getModuleCount();
			var cells = Array.from({ length: moduleCount }, function(_, rowIndex) {
				return Array.from({ length: moduleCount }, function(_, colIndex) {
					return qr.isDark(rowIndex, colIndex);
				});
			});
			return /*#__PURE__*/ react.default.createElement(QRCodeSvg, _extends({}, props, {
				bgColor,
				bgD: cells.map(function(row, rowIndex) {
					return row.map(function(cell, cellIndex) {
						return !cell ? "M ".concat(cellIndex, " ").concat(rowIndex, " l 1 0 0 1 -1 0 Z") : "";
					}).join(" ");
				}).join(" "),
				fgColor,
				fgD: cells.map(function(row, rowIndex) {
					return row.map(function(cell, cellIndex) {
						return cell ? "M ".concat(cellIndex, " ").concat(rowIndex, " l 1 0 0 1 -1 0 Z") : "";
					}).join(" ");
				}).join(" "),
				ref,
				size,
				viewBoxSize: moduleCount
			}));
		});
		QRCode.displayName = "QRCode";
		QRCode.propTypes = propTypes;
		//#endregion
		//#region lib/types/client/explorer.js
		/** Block-explorer URL mapping for on-chain transaction links in the popup. */
		/** Known CAIP-2 networks → explorer base URL. */
		const EXPLORERS = {
			"eip155:8453": "https://basescan.org",
			"eip155:84532": "https://sepolia.basescan.org",
			"eip155:1": "https://etherscan.io",
			"eip155:11155111": "https://sepolia.etherscan.io",
			"eip155:10": "https://optimistic.etherscan.io",
			"eip155:42161": "https://arbiscan.io"
		};
		/**
		* The block-explorer transaction URL for one network, when the network is known.
		* @param network - CAIP-2 network identifier from the wallet snapshot.
		* @param hash - on-chain transaction hash.
		* @returns the explorer URL, or undefined for an unmapped network.
		*/
		function explorerTxUrl(network, hash) {
			const base = EXPLORERS[network];
			return base === void 0 ? void 0 : `${base}/tx/${hash}`;
		}
		//#endregion
		//#region \0dsh-css:/Users/daniel/workspace/deepseek-harness/packages/client/ui-x402/src/client/X402WalletModal.module.css.mjs
		const css$2 = ".GSt5_W_dialog{border-radius:16px;width:340px;max-width:calc(100vw - 32px)}.GSt5_W_shell{flex-direction:column;gap:10px;max-height:70vh;padding:14px;display:flex;overflow-y:auto}.GSt5_W_header{justify-content:space-between;align-items:center;gap:8px;display:flex}.GSt5_W_walletButton{cursor:pointer;color:var(--dsw-alias-label-primary);text-align:left;background:0 0;border:none;border-radius:10px;flex-direction:column;align-items:flex-start;gap:2px;padding:6px 8px;display:flex}.GSt5_W_walletButton:hover{background:var(--dsw-alias-interactive-bg-hover)}.GSt5_W_headerName{text-overflow:ellipsis;white-space:nowrap;max-width:200px;font-size:13px;font-weight:600;overflow:hidden}.GSt5_W_headerNetwork{color:var(--dsw-alias-label-tertiary);align-items:center;gap:2px;font-size:11px;display:inline-flex}.GSt5_W_back{cursor:pointer;color:var(--dsw-alias-label-secondary);background:0 0;border:none;border-radius:8px;padding:6px 8px;font-size:12px}.GSt5_W_back:hover{background:var(--dsw-alias-interactive-bg-hover)}.GSt5_W_headerTools{align-items:center;gap:2px;display:inline-flex}.GSt5_W_close{cursor:pointer;width:28px;height:28px;color:var(--dsw-alias-label-secondary);background:0 0;border:none;border-radius:8px;justify-content:center;align-items:center;display:inline-flex}.GSt5_W_close:hover{background:var(--dsw-alias-interactive-bg-hover)}.GSt5_W_error{background:var(--dsw-alias-state-error-secondary);color:var(--dsw-static-neutral-bluish-00);word-break:break-all;border-radius:8px;padding:8px 10px;font-size:12px}.GSt5_W_center{color:var(--dsw-alias-label-tertiary);text-align:center;padding:10px 0;font-size:12px}.GSt5_W_empty{text-align:center;flex-direction:column;align-items:center;gap:10px;padding:28px 12px;display:flex}.GSt5_W_emptyTitle{color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600}.GSt5_W_emptyHint{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:1.6}.GSt5_W_primary{background:var(--dsw-alias-button-primary-fill);width:100%;color:var(--dsw-alias-label-primary-inverted);cursor:pointer;border:none;border-radius:10px;justify-content:center;align-items:center;gap:6px;margin-top:4px;padding:10px 12px;font-size:13px;font-weight:600;display:inline-flex}.GSt5_W_primary:hover{background:var(--dsw-alias-button-primary-hover)}.GSt5_W_primary:disabled{opacity:.6;cursor:default}.GSt5_W_main{flex-direction:column;gap:8px;display:flex}.GSt5_W_hero{flex-direction:column;align-items:center;gap:2px;padding:16px 0 12px;display:flex}.GSt5_W_heroLabel{color:var(--dsw-alias-label-tertiary);font-size:11px}.GSt5_W_heroAmount{font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-primary);font-size:34px;font-weight:700;line-height:1.1}.GSt5_W_heroUnit{color:var(--dsw-alias-label-secondary);font-size:12px}.GSt5_W_actions{grid-template-columns:1fr 1fr;gap:8px;display:grid}.GSt5_W_action{background:var(--dsw-alias-interactive-bg-active);cursor:pointer;color:var(--dsw-alias-label-primary);border:none;border-radius:10px;justify-content:center;align-items:center;gap:6px;padding:10px;font-size:13px;font-weight:600;display:inline-flex}.GSt5_W_action:hover{background:var(--dsw-alias-interactive-bg-hover-solid)}.GSt5_W_sectionTitle{color:var(--dsw-alias-label-tertiary);text-transform:uppercase;letter-spacing:.04em;margin-top:6px;font-size:11px;font-weight:600}.GSt5_W_tokenRow{border:1px solid var(--dsw-alias-border-l);border-radius:10px;align-items:center;gap:8px;padding:8px 10px;display:flex}.GSt5_W_tokenBadge{background:var(--dsw-alias-interactive-bg-active);width:22px;height:22px;color:var(--dsw-alias-label-secondary);border-radius:50%;justify-content:center;align-items:center;font-size:12px;font-weight:700;display:inline-flex}.GSt5_W_tokenName{flex:1;font-size:13px;font-weight:600}.GSt5_W_tokenAmount{font-variant-numeric:tabular-nums;font-size:13px}.GSt5_W_activity{flex-direction:column;margin:0;padding:0;list-style:none;display:flex}.GSt5_W_activityRow{border-bottom:1px solid var(--dsw-alias-border-l);grid-template-columns:auto 1fr auto;align-items:center;gap:8px;padding:8px 4px;font-size:12px;display:grid}.GSt5_W_activityRow:last-child{border-bottom:none}.GSt5_W_amountOut{color:var(--dsw-alias-state-error-primary);font-variant-numeric:tabular-nums}.GSt5_W_amountIn{color:var(--dsw-alias-state-success-primary);font-variant-numeric:tabular-nums}.GSt5_W_activityMeta{color:var(--dsw-alias-label-secondary);text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.GSt5_W_activityBlock{color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums}.GSt5_W_txLink{color:inherit;text-decoration:none}.GSt5_W_txLink:hover{color:var(--dsw-alias-label-primary-bluish);text-decoration:underline}.GSt5_W_receive{flex-direction:column;align-items:center;gap:10px;padding:14px 0 6px;display:flex}.GSt5_W_qrWrap{border:1px solid var(--dsw-alias-border-l);background:var(--dsw-alias-bg-base);border-radius:12px;padding:10px}.GSt5_W_addressLabel{color:var(--dsw-alias-label-tertiary);font-size:11px}.GSt5_W_address{background:var(--dsw-alias-interactive-bg-active);width:100%;color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-mono);word-break:break-all;text-align:center;border-radius:8px;padding:8px 10px;font-size:11px}.GSt5_W_copyOk{align-items:center;gap:6px;display:inline-flex}.GSt5_W_hint{color:var(--dsw-alias-label-tertiary);text-align:center;font-size:11px;line-height:1.6}.GSt5_W_receipt{text-align:center;flex-direction:column;align-items:center;gap:8px;padding:20px 6px 6px;display:flex}.GSt5_W_receiptIcon{background:var(--dsw-alias-state-success-secondary);width:44px;height:44px;color:var(--dsw-alias-state-success-primary);border-radius:50%;justify-content:center;align-items:center;display:inline-flex}.GSt5_W_receiptTitle{font-size:15px;font-weight:600}.GSt5_W_receiptMeta{color:var(--dsw-alias-label-tertiary);font-size:11px}.GSt5_W_tx{background:var(--dsw-alias-interactive-bg-active);width:100%;color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-mono);word-break:break-all;border-radius:8px;padding:8px 10px;font-size:11px}.GSt5_W_form{flex-direction:column;gap:10px;display:flex}.GSt5_W_field{flex-direction:column;gap:4px;display:flex}.GSt5_W_fieldLabel{color:var(--dsw-alias-label-secondary);font-size:12px}.GSt5_W_input,.GSt5_W_textarea{border:1px solid var(--dsw-alias-border-l);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);border-radius:10px;outline:none;padding:9px 10px;font-size:13px}.GSt5_W_input:focus,.GSt5_W_textarea:focus{border-color:var(--dsw-alias-button-primary-fill)}.GSt5_W_textarea{resize:vertical;min-height:64px;font-family:var(--dsw-font-mono);font-size:11px}.GSt5_W_segmented{background:var(--dsw-alias-interactive-bg-active);border-radius:10px;grid-template-columns:1fr 1fr;gap:4px;padding:3px;display:grid}.GSt5_W_segment,.GSt5_W_segmentActive{cursor:pointer;color:var(--dsw-alias-label-secondary);background:0 0;border:none;border-radius:8px;padding:7px;font-size:12px}.GSt5_W_segmentActive{background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary);font-weight:600}.GSt5_W_switcher{border:1px solid var(--dsw-alias-border-l);border-radius:12px;flex-direction:column;gap:4px;padding:6px;display:flex}.GSt5_W_switcherTitle{color:var(--dsw-alias-label-tertiary);padding:4px 8px;font-size:11px}.GSt5_W_switcherList{flex-direction:column;margin:0;padding:0;list-style:none;display:flex}.GSt5_W_walletRow{cursor:pointer;width:100%;color:var(--dsw-alias-label-primary);text-align:left;background:0 0;border:none;border-radius:8px;justify-content:space-between;align-items:center;gap:8px;padding:8px;display:flex}.GSt5_W_walletRow:hover{background:var(--dsw-alias-interactive-bg-hover)}.GSt5_W_walletMeta{flex-direction:column;gap:2px;min-width:0;display:flex}.GSt5_W_walletLabel{text-overflow:ellipsis;white-space:nowrap;font-size:13px;font-weight:600;overflow:hidden}.GSt5_W_walletAddress{color:var(--dsw-alias-label-tertiary);font-family:var(--dsw-font-mono);font-size:11px}.GSt5_W_currentBadge{background:var(--dsw-alias-button-primary-dimmed);color:var(--dsw-alias-button-primary-fill);white-space:nowrap;border-radius:999px;padding:2px 8px;font-size:11px}.GSt5_W_newWallet{border:1px dashed var(--dsw-alias-border-l);cursor:pointer;color:var(--dsw-alias-label-secondary);background:0 0;border-radius:8px;justify-content:center;align-items:center;gap:6px;padding:8px;font-size:12px;display:inline-flex}.GSt5_W_newWallet:hover{background:var(--dsw-alias-interactive-bg-hover)}";
		const tagId$2 = "@deepseek-ai/dsh-client-ui-x402/X402WalletModal.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$2) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-x402";
			tag.dataset.pluginCss = tagId$2;
			tag.textContent = css$2;
			document.head.appendChild(tag);
		}
		var X402WalletModal_module_css_default = {
			"dialog": "GSt5_W_dialog",
			"textarea": "GSt5_W_textarea",
			"center": "GSt5_W_center",
			"walletAddress": "GSt5_W_walletAddress",
			"header": "GSt5_W_header",
			"switcherList": "GSt5_W_switcherList",
			"receiptTitle": "GSt5_W_receiptTitle",
			"main": "GSt5_W_main",
			"tokenRow": "GSt5_W_tokenRow",
			"form": "GSt5_W_form",
			"primary": "GSt5_W_primary",
			"input": "GSt5_W_input",
			"segmented": "GSt5_W_segmented",
			"emptyTitle": "GSt5_W_emptyTitle",
			"heroLabel": "GSt5_W_heroLabel",
			"amountIn": "GSt5_W_amountIn",
			"hint": "GSt5_W_hint",
			"addressLabel": "GSt5_W_addressLabel",
			"tokenName": "GSt5_W_tokenName",
			"back": "GSt5_W_back",
			"txLink": "GSt5_W_txLink",
			"close": "GSt5_W_close",
			"action": "GSt5_W_action",
			"shell": "GSt5_W_shell",
			"headerTools": "GSt5_W_headerTools",
			"activityBlock": "GSt5_W_activityBlock",
			"error": "GSt5_W_error",
			"walletButton": "GSt5_W_walletButton",
			"field": "GSt5_W_field",
			"currentBadge": "GSt5_W_currentBadge",
			"headerName": "GSt5_W_headerName",
			"switcherTitle": "GSt5_W_switcherTitle",
			"tokenAmount": "GSt5_W_tokenAmount",
			"receive": "GSt5_W_receive",
			"segmentActive": "GSt5_W_segmentActive",
			"heroUnit": "GSt5_W_heroUnit",
			"actions": "GSt5_W_actions",
			"emptyHint": "GSt5_W_emptyHint",
			"receiptIcon": "GSt5_W_receiptIcon",
			"activityRow": "GSt5_W_activityRow",
			"tokenBadge": "GSt5_W_tokenBadge",
			"activity": "GSt5_W_activity",
			"tx": "GSt5_W_tx",
			"address": "GSt5_W_address",
			"newWallet": "GSt5_W_newWallet",
			"segment": "GSt5_W_segment",
			"sectionTitle": "GSt5_W_sectionTitle",
			"switcher": "GSt5_W_switcher",
			"fieldLabel": "GSt5_W_fieldLabel",
			"walletLabel": "GSt5_W_walletLabel",
			"receipt": "GSt5_W_receipt",
			"walletRow": "GSt5_W_walletRow",
			"amountOut": "GSt5_W_amountOut",
			"walletMeta": "GSt5_W_walletMeta",
			"receiptMeta": "GSt5_W_receiptMeta",
			"empty": "GSt5_W_empty",
			"heroAmount": "GSt5_W_heroAmount",
			"copyOk": "GSt5_W_copyOk",
			"qrWrap": "GSt5_W_qrWrap",
			"headerNetwork": "GSt5_W_headerNetwork",
			"activityMeta": "GSt5_W_activityMeta",
			"hero": "GSt5_W_hero"
		};
		//#endregion
		//#region lib/types/client/X402WalletModal.js
		/** Phantom-style wallet popup: balance hero, send/receive, activity, and the wallet switcher. */
		/** Truncate an address to a displayable short form. */
		function shortAddress(address) {
			return address.length <= 12 ? address : `${address.slice(0, 6)}…${address.slice(-4)}`;
		}
		/** Wrap children in a block-explorer link when the network is known. */
		function TxLink({ network, hash, children }) {
			const url = explorerTxUrl(network, hash);
			if (url === void 0) return (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children });
			return (0, react_jsx_runtime.jsx)("a", {
				className: X402WalletModal_module_css_default.txLink,
				href: url,
				target: "_blank",
				rel: "noreferrer",
				title: hash,
				children
			});
		}
		/** How long the transient copy label stays visible, in ms. */
		const COPIED_MS = 1e3;
		/** Receive-screen balance polling interval, in ms. */
		const RECEIVE_POLL_MS = 5e3;
		/** Render the balance hero and the send/receive actions. */
		function MainView({ wallet, history, payments, t, onSend, onReceive, onCreate }) {
			if (wallet === null) return (0, react_jsx_runtime.jsx)("div", {
				className: X402WalletModal_module_css_default.center,
				children: t("main.loading")
			});
			if (!wallet.configured) return (0, react_jsx_runtime.jsxs)("div", {
				className: X402WalletModal_module_css_default.empty,
				children: [
					(0, react_jsx_runtime.jsx)("div", {
						className: X402WalletModal_module_css_default.emptyTitle,
						children: t("main.empty")
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: X402WalletModal_module_css_default.emptyHint,
						children: t("main.emptyHint")
					}),
					(0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: X402WalletModal_module_css_default.primary,
						onClick: onCreate,
						children: t("main.create")
					})
				]
			});
			return (0, react_jsx_runtime.jsxs)("div", {
				className: X402WalletModal_module_css_default.main,
				children: [
					(0, react_jsx_runtime.jsxs)("div", {
						className: X402WalletModal_module_css_default.hero,
						children: [
							(0, react_jsx_runtime.jsx)("div", {
								className: X402WalletModal_module_css_default.heroLabel,
								children: t("main.balance")
							}),
							(0, react_jsx_runtime.jsx)("div", {
								className: X402WalletModal_module_css_default.heroAmount,
								children: wallet.usdcBalance ?? "--"
							}),
							(0, react_jsx_runtime.jsx)("div", {
								className: X402WalletModal_module_css_default.heroUnit,
								children: "USDC"
							})
						]
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: X402WalletModal_module_css_default.actions,
						children: [(0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: X402WalletModal_module_css_default.action,
							onClick: onSend,
							children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSendOutline16, {}), t("main.send")]
						}), (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: X402WalletModal_module_css_default.action,
							onClick: onReceive,
							children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPlusOutline16, {}), t("main.receive")]
						})]
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: X402WalletModal_module_css_default.sectionTitle,
						children: t("main.assets")
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: X402WalletModal_module_css_default.tokenRow,
						children: [
							(0, react_jsx_runtime.jsx)("span", {
								className: X402WalletModal_module_css_default.tokenBadge,
								children: "$"
							}),
							(0, react_jsx_runtime.jsx)("span", {
								className: X402WalletModal_module_css_default.tokenName,
								children: "USDC"
							}),
							(0, react_jsx_runtime.jsx)("span", {
								className: X402WalletModal_module_css_default.tokenAmount,
								children: wallet.usdcBalance ?? "--"
							})
						]
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: X402WalletModal_module_css_default.sectionTitle,
						children: t("main.activity")
					}),
					history.length === 0 && (0, react_jsx_runtime.jsx)("div", {
						className: X402WalletModal_module_css_default.center,
						children: t("main.activityEmpty")
					}),
					(0, react_jsx_runtime.jsx)("ul", {
						className: X402WalletModal_module_css_default.activity,
						children: history.map((entry) => (0, react_jsx_runtime.jsxs)("li", {
							className: X402WalletModal_module_css_default.activityRow,
							children: [
								(0, react_jsx_runtime.jsxs)("span", {
									className: entry.direction === "out" ? X402WalletModal_module_css_default.amountOut : X402WalletModal_module_css_default.amountIn,
									children: [entry.direction === "out" ? "−" : "+", entry.amountUsdc]
								}),
								(0, react_jsx_runtime.jsxs)("span", {
									className: X402WalletModal_module_css_default.activityMeta,
									children: [
										entry.direction === "out" ? t("main.send") : t("main.receive"),
										" · ",
										shortAddress(entry.direction === "out" ? entry.to : entry.from)
									]
								}),
								(0, react_jsx_runtime.jsx)(TxLink, {
									network: wallet.network,
									hash: entry.hash,
									children: (0, react_jsx_runtime.jsxs)("span", {
										className: X402WalletModal_module_css_default.activityBlock,
										children: ["#", entry.blockNumber]
									})
								})
							]
						}, entry.hash))
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: X402WalletModal_module_css_default.sectionTitle,
						children: t("main.payments")
					}),
					payments.length === 0 && (0, react_jsx_runtime.jsx)("div", {
						className: X402WalletModal_module_css_default.center,
						children: t("main.paymentsEmpty")
					}),
					(0, react_jsx_runtime.jsx)("ul", {
						className: X402WalletModal_module_css_default.activity,
						children: payments.slice(0, 6).map((payment) => (0, react_jsx_runtime.jsxs)("li", {
							className: X402WalletModal_module_css_default.activityRow,
							children: [
								(0, react_jsx_runtime.jsxs)("span", {
									className: payment.status === "settled" ? X402WalletModal_module_css_default.amountOut : X402WalletModal_module_css_default.amountIn,
									children: ["−", payment.amountUsdc]
								}),
								(0, react_jsx_runtime.jsxs)("span", {
									className: X402WalletModal_module_css_default.activityMeta,
									children: [
										payment.status === "settled" ? t("history.settled") : t("history.failed"),
										" · ",
										payment.url
									]
								}),
								(0, react_jsx_runtime.jsx)("span", {
									className: X402WalletModal_module_css_default.activityBlock,
									children: payment.network
								})
							]
						}, payment.id))
					})
				]
			});
		}
		/** Render the receive view: full address, QR code, and copy. */
		function ReceiveView({ wallet, t }) {
			const [copied, setCopied] = (0, react.useState)(false);
			const address = wallet?.configured === true ? wallet.address ?? "" : "";
			const copy = () => {
				(0, _deepseek_ai_dsh_client_ui_primitives.writeClipboard)(address).then((ok) => {
					if (!ok || copied) return;
					setCopied(true);
					window.setTimeout(() => {
						setCopied(false);
					}, COPIED_MS);
				});
			};
			return (0, react_jsx_runtime.jsxs)("div", {
				className: X402WalletModal_module_css_default.receive,
				children: [
					(0, react_jsx_runtime.jsx)("div", {
						className: X402WalletModal_module_css_default.qrWrap,
						"aria-label": t("receive.qr"),
						children: (0, react_jsx_runtime.jsx)(QRCode, {
							value: address || " ",
							size: 148
						})
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: X402WalletModal_module_css_default.addressLabel,
						children: t("receive.address")
					}),
					(0, react_jsx_runtime.jsx)("code", {
						className: X402WalletModal_module_css_default.address,
						children: address
					}),
					(0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: X402WalletModal_module_css_default.primary,
						"aria-label": t("receive.copy"),
						onClick: copy,
						children: copied ? (0, react_jsx_runtime.jsxs)("span", {
							className: X402WalletModal_module_css_default.copyOk,
							children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCheckOutline16, {}), t("receive.copied")]
						}) : (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCopyOutline16, {}), t("receive.copy")] })
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: X402WalletModal_module_css_default.hint,
						children: t("receive.hint", { network: wallet?.network ?? "" })
					})
				]
			});
		}
		/** Render the send view: recipient + amount, then the confirmed receipt. */
		function SendView({ form, t, face, actions, network }) {
			const submit = (event) => {
				event.preventDefault();
				if (form.busy) return;
				if (!/^0x[0-9a-fA-F]{40}$/.test(form.to.trim()) || !(Number(form.amount) > 0)) {
					actions.patchSendForm({ error: t("send.invalid") });
					return;
				}
				actions.patchSendForm({ error: null });
				face.send(form.to.trim(), form.amount.trim());
			};
			if (form.done !== null) return (0, react_jsx_runtime.jsxs)("div", {
				className: X402WalletModal_module_css_default.receipt,
				children: [
					(0, react_jsx_runtime.jsx)("span", {
						className: X402WalletModal_module_css_default.receiptIcon,
						children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCheckOutline16, {})
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: X402WalletModal_module_css_default.receiptTitle,
						children: t("send.confirmed")
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: X402WalletModal_module_css_default.receiptMeta,
						children: t("send.transaction")
					}),
					(0, react_jsx_runtime.jsx)(TxLink, {
						network,
						hash: form.done.transaction,
						children: (0, react_jsx_runtime.jsx)("code", {
							className: X402WalletModal_module_css_default.tx,
							children: form.done.transaction
						})
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: X402WalletModal_module_css_default.receiptMeta,
						children: [
							form.done.amountUsdc,
							" USDC → ",
							shortAddress(form.done.to)
						]
					}),
					(0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: X402WalletModal_module_css_default.primary,
						onClick: () => {
							actions.resetSendForm();
							actions.setView({ kind: "main" });
						},
						children: t("send.done")
					})
				]
			});
			return (0, react_jsx_runtime.jsxs)("form", {
				className: X402WalletModal_module_css_default.form,
				onSubmit: submit,
				children: [
					(0, react_jsx_runtime.jsxs)("label", {
						className: X402WalletModal_module_css_default.field,
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: X402WalletModal_module_css_default.fieldLabel,
							children: t("send.to")
						}), (0, react_jsx_runtime.jsx)("input", {
							className: X402WalletModal_module_css_default.input,
							value: form.to,
							placeholder: t("send.toPlaceholder"),
							onChange: (event) => {
								actions.patchSendForm({ to: event.target.value });
							}
						})]
					}),
					(0, react_jsx_runtime.jsxs)("label", {
						className: X402WalletModal_module_css_default.field,
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: X402WalletModal_module_css_default.fieldLabel,
							children: t("send.amount")
						}), (0, react_jsx_runtime.jsx)("input", {
							className: X402WalletModal_module_css_default.input,
							type: "number",
							min: "0",
							step: "any",
							value: form.amount,
							placeholder: t("send.amountPlaceholder"),
							onChange: (event) => {
								actions.patchSendForm({ amount: event.target.value });
							}
						})]
					}),
					form.error !== null && (0, react_jsx_runtime.jsx)("div", {
						className: X402WalletModal_module_css_default.error,
						children: form.error
					}),
					(0, react_jsx_runtime.jsx)("button", {
						type: "submit",
						className: X402WalletModal_module_css_default.primary,
						disabled: form.busy,
						children: form.busy ? t("send.busy") : t("send.submit")
					})
				]
			});
		}
		/** Render the create/import view: label plus generate or imported key. */
		function CreateView({ form, t, face, actions }) {
			const submit = (event) => {
				event.preventDefault();
				if (form.busy) return;
				const key = form.privateKey.trim();
				face.createWallet(form.label.trim(), form.importing && key !== "" ? key : void 0);
			};
			return (0, react_jsx_runtime.jsxs)("form", {
				className: X402WalletModal_module_css_default.form,
				onSubmit: submit,
				children: [
					(0, react_jsx_runtime.jsxs)("label", {
						className: X402WalletModal_module_css_default.field,
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: X402WalletModal_module_css_default.fieldLabel,
							children: t("create.label")
						}), (0, react_jsx_runtime.jsx)("input", {
							className: X402WalletModal_module_css_default.input,
							value: form.label,
							placeholder: t("create.labelPlaceholder"),
							onChange: (event) => {
								actions.patchCreateForm({ label: event.target.value });
							}
						})]
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: X402WalletModal_module_css_default.segmented,
						children: [(0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: form.importing ? X402WalletModal_module_css_default.segment : X402WalletModal_module_css_default.segmentActive,
							onClick: () => {
								actions.patchCreateForm({ importing: false });
							},
							children: t("create.generate")
						}), (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: form.importing ? X402WalletModal_module_css_default.segmentActive : X402WalletModal_module_css_default.segment,
							onClick: () => {
								actions.patchCreateForm({ importing: true });
							},
							children: t("create.import")
						})]
					}),
					form.importing && (0, react_jsx_runtime.jsxs)("label", {
						className: X402WalletModal_module_css_default.field,
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: X402WalletModal_module_css_default.fieldLabel,
							children: t("create.privateKey")
						}), (0, react_jsx_runtime.jsx)("textarea", {
							className: X402WalletModal_module_css_default.textarea,
							value: form.privateKey,
							placeholder: t("create.privateKeyPlaceholder"),
							onChange: (event) => {
								actions.patchCreateForm({ privateKey: event.target.value });
							}
						})]
					}),
					form.importing && (0, react_jsx_runtime.jsx)("div", {
						className: X402WalletModal_module_css_default.hint,
						children: t("create.importHint")
					}),
					form.error !== null && (0, react_jsx_runtime.jsx)("div", {
						className: X402WalletModal_module_css_default.error,
						children: form.error
					}),
					(0, react_jsx_runtime.jsx)("button", {
						type: "submit",
						className: X402WalletModal_module_css_default.primary,
						disabled: form.busy,
						children: form.busy ? t("create.busy") : t("create.submit")
					})
				]
			});
		}
		/** Render the wallet switcher list, one row per registered wallet. */
		function WalletList({ wallets, t, onPick, onNew }) {
			return (0, react_jsx_runtime.jsxs)("div", {
				className: X402WalletModal_module_css_default.switcher,
				children: [
					(0, react_jsx_runtime.jsx)("div", {
						className: X402WalletModal_module_css_default.switcherTitle,
						children: t("switch.title")
					}),
					(0, react_jsx_runtime.jsx)("ul", {
						className: X402WalletModal_module_css_default.switcherList,
						children: wallets.map((wallet) => (0, react_jsx_runtime.jsx)("li", { children: (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: X402WalletModal_module_css_default.walletRow,
							onClick: () => {
								onPick(wallet.id);
							},
							children: [(0, react_jsx_runtime.jsxs)("span", {
								className: X402WalletModal_module_css_default.walletMeta,
								children: [(0, react_jsx_runtime.jsx)("span", {
									className: X402WalletModal_module_css_default.walletLabel,
									children: wallet.label
								}), (0, react_jsx_runtime.jsx)("span", {
									className: X402WalletModal_module_css_default.walletAddress,
									children: shortAddress(wallet.address)
								})]
							}), wallet.isCurrent && (0, react_jsx_runtime.jsx)("span", {
								className: X402WalletModal_module_css_default.currentBadge,
								children: t("switch.current")
							})]
						}) }, wallet.id))
					}),
					(0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: X402WalletModal_module_css_default.newWallet,
						onClick: onNew,
						children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPlusOutline16, {}), t("switch.new")]
					})
				]
			});
		}
		/** Render the Phantom-style wallet popup with the four modal screens. */
		function X402WalletModal({ useStore, actions, face, t }) {
			const state = useStore((snapshot) => snapshot);
			const [switcher, setSwitcher] = (0, react.useState)(false);
			const close = () => {
				actions.setOpen(false);
			};
			const goMain = () => {
				actions.setView({ kind: "main" });
				setSwitcher(false);
			};
			const view = state.view;
			(0, react.useEffect)(() => {
				if (!state.open || view.kind !== "receive") return;
				const timer = window.setInterval(() => {
					face.refresh();
				}, RECEIVE_POLL_MS);
				return () => {
					window.clearInterval(timer);
				};
			}, [
				state.open,
				view.kind,
				face
			]);
			return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
				open: state.open,
				onClose: close,
				title: t("modal.title"),
				closeLabel: t("modal.close"),
				headless: true,
				className: X402WalletModal_module_css_default.dialog,
				children: (0, react_jsx_runtime.jsxs)("div", {
					className: X402WalletModal_module_css_default.shell,
					children: [
						(0, react_jsx_runtime.jsxs)("header", {
							className: X402WalletModal_module_css_default.header,
							children: [view.kind === "main" ? (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: X402WalletModal_module_css_default.walletButton,
								onClick: () => {
									setSwitcher((value) => !value);
								},
								"aria-expanded": switcher,
								children: [(0, react_jsx_runtime.jsx)("span", {
									className: X402WalletModal_module_css_default.headerName,
									children: state.wallet?.configured === true ? state.wallet.label ?? shortAddress(state.wallet.address ?? "") : t("main.empty")
								}), (0, react_jsx_runtime.jsxs)("span", {
									className: X402WalletModal_module_css_default.headerNetwork,
									children: [state.wallet?.network ?? "", (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, {})]
								})]
							}) : (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: X402WalletModal_module_css_default.back,
								onClick: goMain,
								children: t("common.back")
							}), (0, react_jsx_runtime.jsxs)("span", {
								className: X402WalletModal_module_css_default.headerTools,
								children: [(0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: X402WalletModal_module_css_default.close,
									"aria-label": t("action.refresh"),
									onClick: () => {
										face.refresh();
									},
									children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconRefreshOutline16, {})
								}), (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: X402WalletModal_module_css_default.close,
									"aria-label": t("modal.close"),
									onClick: close,
									children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCloseOutline16, {})
								})]
							})]
						}),
						state.error !== null && (0, react_jsx_runtime.jsx)("div", {
							className: X402WalletModal_module_css_default.error,
							children: t("modal.error", { message: state.error })
						}),
						switcher && view.kind === "main" && (0, react_jsx_runtime.jsx)(WalletList, {
							wallets: state.wallets,
							t,
							onPick: (id) => {
								setSwitcher(false);
								face.selectWallet(id);
							},
							onNew: () => {
								setSwitcher(false);
								actions.setView({ kind: "create" });
							}
						}),
						view.kind === "main" && (0, react_jsx_runtime.jsx)(MainView, {
							wallet: state.wallet,
							history: state.history,
							payments: state.payments,
							t,
							onSend: () => {
								actions.setView({ kind: "send" });
							},
							onReceive: () => {
								actions.setView({ kind: "receive" });
							},
							onCreate: () => {
								actions.setView({ kind: "create" });
							}
						}),
						view.kind === "receive" && (0, react_jsx_runtime.jsx)(ReceiveView, {
							wallet: state.wallet,
							t
						}),
						view.kind === "send" && (0, react_jsx_runtime.jsx)(SendView, {
							form: state.sendForm,
							t,
							face,
							actions,
							network: state.wallet?.network ?? ""
						}),
						view.kind === "create" && (0, react_jsx_runtime.jsx)(CreateView, {
							form: state.createForm,
							t,
							face,
							actions
						})
					]
				})
			});
		}
		//#endregion
		//#region \0dsh-css:/Users/daniel/workspace/deepseek-harness/packages/client/ui-x402/src/client/X402WalletEntry.module.css.mjs
		const css$1 = ".gH8mvq_entry{cursor:pointer;width:100%;color:var(--dsw-alias-label-secondary);text-align:left;background:0 0;border:none;border-radius:8px;align-items:center;gap:6px;padding:6px 10px;font-size:12px;display:flex}.gH8mvq_entry:hover{background:var(--dsw-alias-interactive-bg-hover)}.gH8mvq_entryMark{background:var(--dsw-alias-button-primary-fill);width:18px;height:18px;color:var(--dsw-alias-label-primary-inverted);border-radius:50%;justify-content:center;align-items:center;font-size:11px;font-weight:700;display:inline-flex}.gH8mvq_entry[data-unconfigured] .gH8mvq_entryMark{background:var(--dsw-alias-state-warn-primary)}.gH8mvq_entryLabel{text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;overflow:hidden}";
		const tagId$1 = "@deepseek-ai/dsh-client-ui-x402/X402WalletEntry.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-x402";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var X402WalletEntry_module_css_default = {
			"entryMark": "gH8mvq_entryMark",
			"entryLabel": "gH8mvq_entryLabel",
			"entry": "gH8mvq_entry"
		};
		//#endregion
		//#region lib/types/client/X402WalletEntry.js
		/** Sidebar entry that opens the Phantom-style x402 wallet popup. */
		/**
		* Sidebar entry button plus the wallet popup it opens. The modal is rendered
		* directly here: the primitives Modal portals to the document body, so no
		* separate slot surface is needed. `open` and `refresh` come from the inject
		* face (open is a verb, distinct from the store's `open` boolean, which lives
		* inside the snapshot).
		*/
		function X402WalletEntry({ useStore, actions, open, refresh, createWallet, selectWallet, send, t }) {
			const state = useStore((snapshot) => snapshot);
			(0, react.useEffect)(() => {
				refresh();
			}, [refresh]);
			const hasWallet = state.wallet?.configured === true;
			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
				label: hasWallet ? t("panel.title") : t("entry.unconfigured"),
				children: (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: X402WalletEntry_module_css_default.entry,
					"aria-label": t("a11y.wallet"),
					"data-unconfigured": hasWallet ? void 0 : true,
					onClick: () => {
						open();
					},
					children: [(0, react_jsx_runtime.jsx)("span", {
						className: X402WalletEntry_module_css_default.entryMark,
						children: "$"
					}), (0, react_jsx_runtime.jsx)("span", {
						className: X402WalletEntry_module_css_default.entryLabel,
						children: t("panel.title")
					})]
				})
			}), (0, react_jsx_runtime.jsx)(X402WalletModal, {
				useStore,
				actions,
				face: {
					refresh,
					createWallet,
					selectWallet,
					send
				},
				t
			})] });
		}
		//#endregion
		//#region lib/types/client/card-model.js
		/** Pure projection of one `x402_pay` call from the frozen call/result node. */
		/** Parse the call arguments from the frozen call head. */
		function parseArgs(raw) {
			try {
				const parsed = JSON.parse(raw);
				return typeof parsed === "object" && parsed !== null ? parsed : {};
			} catch {
				return {};
			}
		}
		/** Parse the rendered result text for the receipt facts the card shows. */
		function parseResult(block) {
			if (!("kind" in block)) return {
				paymentStatus: null,
				transaction: null
			};
			const text = block.content.filter((part) => part.type === "text").map((part) => part.text).join("\n");
			const status = /paymentStatus:\s*(\w+)/.exec(text)?.[1];
			const transaction = /transaction:\s*(0x[0-9a-fA-F]+)/.exec(text)?.[1] ?? null;
			return {
				paymentStatus: status === "settled" || status === "settle_failed" || status === "payment_required" || status === "none" ? status : null,
				transaction
			};
		}
		/**
		* Derive the card's material from the frozen node — a pure function of the log slice.
		* @param block - frozen running call or settled result node.
		* @returns the payment call's material.
		*/
		function x402CallView(block) {
			const settled = "kind" in block;
			const parsed = parseArgs(settled ? block.call?.argsRaw ?? "{}" : block.argsRaw);
			const result = parseResult(block);
			return {
				url: typeof parsed.url === "string" ? parsed.url : null,
				maxCostUsdc: typeof parsed.maxCostUsdc === "number" ? parsed.maxCostUsdc : null,
				paymentStatus: result.paymentStatus,
				transaction: result.transaction,
				isError: settled ? block.isError : false
			};
		}
		//#endregion
		//#region \0dsh-css:/Users/daniel/workspace/deepseek-harness/packages/client/ui-x402/src/client/X402PaymentRow.module.css.mjs
		const css = "._2gl9da_details{flex-direction:column;gap:4px;margin:0;display:flex}._2gl9da_field{gap:8px;font-size:12px;line-height:1.5;display:flex}._2gl9da_field dt{color:var(--dsw-text-secondary);min-width:24px}._2gl9da_field dd{word-break:break-all;margin:0}._2gl9da_tx{font-family:var(--dsw-font-mono);font-size:11px}";
		const tagId = "@deepseek-ai/dsh-client-ui-x402/X402PaymentRow.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-x402";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var X402PaymentRow_module_css_default = {
			"field": "_2gl9da_field",
			"details": "_2gl9da_details",
			"tx": "_2gl9da_tx"
		};
		//#endregion
		//#region lib/types/client/X402PaymentRow.js
		/** Conversation payment card for `x402_pay` calls: a pure projection of the logged call/result slice. */
		const STATUS_LABELS = {
			settled: "history.settled",
			settle_failed: "history.failed",
			payment_required: "row.paymentRequired",
			none: "row.free"
		};
		function leadingFor(view) {
			if (view.isError) return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: "error" });
			if (view.paymentStatus === "settled") return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCheckOutline16, {});
			if (view.paymentStatus === "settle_failed" || view.paymentStatus === "payment_required") return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCloseOutline16, {});
		}
		/** Render one `x402_pay` call as a payment card. */
		function X402PaymentRow({ block, t }) {
			const [open, setOpen] = (0, react.useState)(false);
			const view = x402CallView(block);
			const statusLabel = view.paymentStatus === null ? null : STATUS_LABELS[view.paymentStatus];
			return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.DisclosureRow, {
				rowClassName: X402PaymentRow_module_css_default.row,
				icon: leadingFor(view),
				title: `${view.url ?? block.callId} · ${statusLabel !== null ? t(statusLabel) : t("row.awaiting")}`,
				open,
				expandable: true,
				expandOnRowClick: true,
				onToggle: () => {
					setOpen((value) => !value);
				},
				children: (0, react_jsx_runtime.jsxs)("dl", {
					className: X402PaymentRow_module_css_default.details,
					children: [view.maxCostUsdc !== null && (0, react_jsx_runtime.jsxs)("div", {
						className: X402PaymentRow_module_css_default.field,
						children: [(0, react_jsx_runtime.jsx)("dt", { children: "cap" }), (0, react_jsx_runtime.jsxs)("dd", { children: [view.maxCostUsdc, " USDC"] })]
					}), view.transaction !== null && (0, react_jsx_runtime.jsxs)("div", {
						className: X402PaymentRow_module_css_default.field,
						children: [(0, react_jsx_runtime.jsx)("dt", { children: "tx" }), (0, react_jsx_runtime.jsx)("dd", {
							className: X402PaymentRow_module_css_default.tx,
							children: view.transaction
						})]
					})]
				})
			});
		}
		//#endregion
		//#region lib/types/client/locales.js
		/** x402 wallet GUI dictionaries. */
		const NS = "x402";
		/** Simplified Chinese x402 wallet messages. */
		const zh = {
			"panel.title": "x402 钱包",
			"a11y.wallet": "x402 钱包",
			"action.refresh": "刷新",
			"modal.title": "x402 钱包",
			"modal.close": "关闭",
			"modal.network": "网络：{network}",
			"modal.error": "读取失败：{message}",
			"common.back": "返回",
			"entry.unconfigured": "尚未创建钱包",
			"main.loading": "读取中…",
			"main.empty": "还没有钱包",
			"main.emptyHint": "创建或导入一个钱包，即可在对话中收款与转出 USDC。",
			"main.create": "创建钱包",
			"main.balance": "总资产",
			"main.send": "发送",
			"main.receive": "收款",
			"main.assets": "资产",
			"main.activity": "交易历史",
			"main.activityEmpty": "还没有交易",
			"main.payments": "支付记录",
			"main.paymentsEmpty": "还没有支付记录",
			"switch.title": "切换钱包",
			"switch.current": "当前",
			"switch.new": "新建钱包",
			"receive.hint": "仅向此地址发送 {network} 网络上的 USDC。",
			"receive.address": "收款地址",
			"receive.copy": "复制地址",
			"receive.copied": "已复制",
			"receive.qr": "收款二维码",
			"send.to": "收款地址",
			"send.toPlaceholder": "0x…",
			"send.amount": "金额（USDC）",
			"send.amountPlaceholder": "0.00",
			"send.submit": "发送",
			"send.busy": "发送中…",
			"send.confirmed": "已确认",
			"send.transaction": "交易",
			"send.done": "完成",
			"send.invalid": "请填写有效的收款地址与大于 0 的金额。",
			"send.error": "发送失败：{message}",
			"create.title": "创建钱包",
			"create.label": "钱包名称",
			"create.labelPlaceholder": "例如：小额支付",
			"create.generate": "生成新钱包",
			"create.import": "导入私钥",
			"create.importHint": "私钥只保存在本机凭据存储中，不会出现在对话、日志或网络上。",
			"create.privateKey": "私钥",
			"create.privateKeyPlaceholder": "0x…（64 位十六进制）",
			"create.submit": "创建",
			"create.busy": "创建中…",
			"create.error": "创建失败：{message}",
			"history.settled": "已支付",
			"history.failed": "失败",
			"row.paid": "{amount} USDC",
			"row.free": "免费调用",
			"row.awaiting": "支付中…",
			"row.rejected": "已拒绝",
			"row.paymentRequired": "仍需支付"
		};
		/** English x402 wallet messages. */
		const en = {
			"panel.title": "x402 Wallet",
			"a11y.wallet": "x402 wallet",
			"action.refresh": "Refresh",
			"modal.title": "x402 Wallet",
			"modal.close": "Close",
			"modal.network": "Network: {network}",
			"modal.error": "Read failed: {message}",
			"common.back": "Back",
			"entry.unconfigured": "No wallet yet",
			"main.loading": "Reading…",
			"main.empty": "No wallet yet",
			"main.emptyHint": "Create or import a wallet to receive and send USDC in conversations.",
			"main.create": "Create wallet",
			"main.balance": "Total balance",
			"main.send": "Send",
			"main.receive": "Receive",
			"main.assets": "Assets",
			"main.activity": "Activity",
			"main.activityEmpty": "No transactions yet",
			"main.payments": "Payments",
			"main.paymentsEmpty": "No payments yet",
			"switch.title": "Switch wallet",
			"switch.current": "Current",
			"switch.new": "New wallet",
			"receive.hint": "Only send USDC on the {network} network to this address.",
			"receive.address": "Wallet address",
			"receive.copy": "Copy address",
			"receive.copied": "Copied",
			"receive.qr": "Receive QR code",
			"send.to": "Recipient address",
			"send.toPlaceholder": "0x…",
			"send.amount": "Amount (USDC)",
			"send.amountPlaceholder": "0.00",
			"send.submit": "Send",
			"send.busy": "Sending…",
			"send.confirmed": "Confirmed",
			"send.transaction": "Transaction",
			"send.done": "Done",
			"send.invalid": "Enter a valid recipient address and an amount greater than 0.",
			"send.error": "Send failed: {message}",
			"create.title": "Create wallet",
			"create.label": "Wallet label",
			"create.labelPlaceholder": "e.g. Micro payments",
			"create.generate": "Generate new wallet",
			"create.import": "Import private key",
			"create.importHint": "The private key is stored only in the local credential store; it never reaches the conversation, the logs, or the network.",
			"create.privateKey": "Private key",
			"create.privateKeyPlaceholder": "0x… (64 hex chars)",
			"create.submit": "Create",
			"create.busy": "Creating…",
			"create.error": "Create failed: {message}",
			"history.settled": "Settled",
			"history.failed": "Failed",
			"row.paid": "{amount} USDC",
			"row.free": "Free call",
			"row.awaiting": "Paying…",
			"row.rejected": "Rejected",
			"row.paymentRequired": "Payment still required"
		};
		//#endregion
		//#region lib/types/client/store.js
		/** Wallet modal store: the one shared live fact for the sidebar surface. */
		const initialSendForm = () => ({
			to: "",
			amount: "",
			busy: false,
			error: null,
			done: null
		});
		const initialCreateForm = () => ({
			label: "",
			privateKey: "",
			importing: false,
			busy: false,
			error: null
		});
		/**
		* Create the wallet-modal store; call once per registration inside `apply`.
		* @returns the store handle the entry registration declares.
		*/
		function createX402PanelStore() {
			return (0, _deepseek_ai_dsh_client_runtime_client.defineStore)({
				init: () => ({
					wallet: null,
					wallets: [],
					history: [],
					payments: [],
					error: null,
					refreshing: false,
					open: false,
					view: { kind: "main" },
					sendForm: initialSendForm(),
					createForm: initialCreateForm()
				}),
				actions: {
					beginRefresh: (d) => {
						d.refreshing = true;
					},
					endRefresh: (d) => {
						d.refreshing = false;
					},
					applyWallet: (d, wallet) => {
						d.wallet = wallet;
					},
					applyWallets: (d, wallets) => {
						d.wallets = wallets;
					},
					applyHistory: (d, history) => {
						d.history = history;
					},
					applyPayments: (d, payments) => {
						d.payments = payments;
					},
					applyError: (d, error) => {
						d.error = error;
					},
					setOpen: (d, open) => {
						d.open = open;
					},
					setView: (d, view) => {
						d.view = view;
					},
					patchSendForm: (d, patch) => {
						d.sendForm = {
							...d.sendForm,
							...patch
						};
					},
					patchCreateForm: (d, patch) => {
						d.createForm = {
							...d.createForm,
							...patch
						};
					},
					resetSendForm: (d) => {
						d.sendForm = initialSendForm();
					},
					resetCreateForm: (d) => {
						d.createForm = initialCreateForm();
					}
				}
			});
		}
		//#endregion
		//#region lib/types/client/index.js
		/** x402 wallet surfaces, browser half: a sidebar entry opening a Phantom-style wallet popup, and the pay card. */
		/** Required services: slot composition, locale dictionaries, the Host Remote carrier, and the x402 namespace. */
		const inject = [
			"slots",
			"locale",
			"remote",
			"remote.x402"
		];
		function errorMessage(error) {
			return error instanceof Error ? error.message : String(error);
		}
		/** Mount the wallet entry/popup and the x402_pay card. */
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "ui-x402: dictionaries");
			const store = createX402PanelStore();
			let refreshRef;
			ctx.remote.$on("x402/payment", () => {
				if (refreshRef !== void 0) refreshRef();
			});
			ctx.on("connection/reset", () => {
				if (refreshRef !== void 0) refreshRef();
			});
			ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register({
				name: "sidebar.footer.action",
				id: "x402-panel",
				locale: NS,
				store,
				inject: (actions) => {
					const refresh = async () => {
						actions.beginRefresh();
						try {
							const [walletAnswer, walletsAnswer, paymentsAnswer] = await Promise.all([
								ctx.remote.x402.wallet(),
								ctx.remote.x402.wallets(),
								ctx.remote.x402.payments()
							]);
							if (!walletAnswer.ok) throw new Error(walletAnswer.error.message);
							if (!walletsAnswer.ok) throw new Error(walletsAnswer.error.message);
							if (!paymentsAnswer.ok) throw new Error(paymentsAnswer.error.message);
							const history = walletAnswer.value.configured ? await ctx.remote.x402.history(void 0) : {
								ok: true,
								value: []
							};
							if (!history.ok) throw new Error(history.error.message);
							actions.applyWallet(walletAnswer.value);
							actions.applyWallets(walletsAnswer.value);
							actions.applyHistory(history.value);
							actions.applyPayments(paymentsAnswer.value);
							actions.applyError(null);
						} catch (error) {
							actions.applyError(errorMessage(error));
						} finally {
							actions.endRefresh();
						}
					};
					const createWallet = async (label, privateKey) => {
						actions.patchCreateForm({
							busy: true,
							error: null
						});
						try {
							const answer = await ctx.remote.x402.createWallet(privateKey === void 0 ? { label } : {
								label,
								privateKey
							});
							if (!answer.ok) throw new Error(answer.error.message);
							actions.resetCreateForm();
							actions.setView({ kind: "main" });
							await refresh();
						} catch (error) {
							actions.patchCreateForm({ error: errorMessage(error) });
						} finally {
							actions.patchCreateForm({ busy: false });
						}
					};
					const selectWallet = async (id) => {
						try {
							const answer = await ctx.remote.x402.selectWallet(id);
							if (!answer.ok) throw new Error(answer.error.message);
							await refresh();
						} catch (error) {
							actions.applyError(errorMessage(error));
						}
					};
					const send = async (to, amountUsdc) => {
						actions.patchSendForm({
							busy: true,
							error: null,
							done: null
						});
						try {
							const answer = await ctx.remote.x402.send({
								to,
								amountUsdc
							});
							if (!answer.ok) throw new Error(answer.error.message);
							actions.patchSendForm({ done: answer.value });
							await refresh();
						} catch (error) {
							actions.patchSendForm({ error: errorMessage(error) });
						} finally {
							actions.patchSendForm({ busy: false });
						}
					};
					refreshRef = refresh;
					return {
						open: () => {
							actions.setOpen(true);
						},
						refresh,
						createWallet,
						selectWallet,
						send
					};
				}
			}, X402WalletEntry));
			ctx.slots.inject("tool.call.toolview", () => ctx.slots.register({
				name: "tool.call.toolview",
				key: "x402_pay",
				locale: NS
			}, X402PaymentRow));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map