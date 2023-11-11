const organization = "{org-id}"
const apiKey = "{api-key}"

const min_size=32

const timeout = 60000

const max_images = 50

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))

async function replace (url, prompt, attempt = 0) {
	console.log(prompt)
	stime = 1000 * (Math.pow(2, attempt+Math.random()))
	await sleep(stime)
	console.log("waited " + stime + "ms for attempt " + attempt)
		//response = await fetch(imageUrl);
		//blob = await response.blob();
	attempt += 1

	try {
		// send the request containing the messages to the OpenAI API
		let response = await fetch('http://localhost:8010/proxy/v1/images/generations', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${apiKey}`,
				'Access-Control-Allow-Origin': '*'
			},
			body: JSON.stringify({
				"prompt": prompt,
				"size": "512x512"
			})
		});

		// check if the API response is ok Else throw an error
		if (!response.ok) {
			if (response.status == 429 && attempt <= 10) {
				// displaying "wow, slow down mate"
				return(await replace(url, prompt, attempt))
			  }
			else {
			throw new Error(`Failed to fetch. Status code: ${response.status}`);
			}
		}

		// get the data from the API response as json
		result = await response.json()
		console.log("Response from OpenAI:\n" + JSON.stringify(result.data[0].url))
		return result.data[0].url
	}
	catch {
		console.log("failed to fetch " + url)
		return url 
	}

};

function get_prompt(item) {
	let prompt_opener = "a whimsical image in a cartoon style of "
	let prompt = ""
	console.log(item)
	if (item.attr('alt') && item.attr('alt').trim() !== "") {
		prompt += item.attr('alt').trim() + " ";
	}
	if (item.attr('title') && item.attr('title').trim() !== "") {
		prompt += item.attr('title').trim() + " ";
	}
	if (item.attr("aria-label") && item.attr("aria-label").trim() !== "") {
		prompt += item.attr("aria-label").trim() + " ";
	}
	if (item.attr("data-description") && item.attr("data-description").trim() !== "") {
		prompt += item.attr("data-description").trim() + " ";
	}
	if (item.attr("data-caption") && item.attr("data-caption").trim() !== "") {
		prompt += item.attr("data-caption").trim() + " ";
	}
	if (prompt == "") {
		prompt = "puppies"
	}
	return prompt_opener + prompt;
}

(function() {
	var main = function($) { 
		
		var self = $.whimsify = new function(){};
		
		$.extend(self, {
			handleImages: async function () {
				var i = 0;
				$.each($('img'), async function (i, item) {
					//Skip if image is already replaced
					if ($(item).attr('srcset')) {
						var domtype = 'srcset'
					} else {
						var domtype = 'src'
					}
					if (!$(item).attr(domtype).includes('openai')) {
						var h = $(item).height();
						var w = $(item).width();

						//If image loaded
						if (h > min_size && w > min_size && i < max_images) {
							//Replace
							console.log("Replacing image with URL: " + $(item).attr(domtype));
							$(item).css('width', w + 'px').css('height', h + 'px');
							var old_url = $(item).attr(domtype)
							var new_url = await replace(old_url, get_prompt($(item)));
							$(item).attr('src', new_url, { noprefix: true });
							$(item).removeAttr('srcset');
							$(item).removeAttr('onerror');

						} else {
							//Replace when loaded
							$(item).on('load', async function () {
								var h = $(item).height();
								var w = $(item).width();
								//Prevent 'infinite' loop
								if (!$(item).attr(domtype).includes('openai') && h > min_size && w > min_size && i < max_images) {
									console.log("Replacing image with URL: " + $(item).attr(domtype));
									var h = $(item).height();
									var w = $(item).width();

									$(item).css('width', w + 'px').css('height', h + 'px');
									var old_url = $(item).attr(domtype)
									var new_url = await replace(old_url, get_prompt($(item)));
									$(item).attr('src', new_url, { noprefix: true });
									$(item).removeAttr('srcset');
									$(item).removeAttr('onerror');
								}
							});
						}
						if ($(item).parent().is('picture') && old_url != new_url) {
							$(item).siblings().remove()
						}
					i += 1
					}
				});
			}
			});


		//Run on jQuery ready
		$(function(){
			self.handleImages();
		});
	};

	//Add jQuery if not present, then run main
	if(typeof jQuery == 'undefined') {
		const script = document.createElement("script");
		script.src = 'https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js';
		script.type = 'text/javascript';
		script.addEventListener('load', () => {
			console.log(`jQuery ${$.fn.jquery} has been loaded successfully!`);
			setTimeout(main(jQuery), timeout);
		});
		document.head.appendChild(script);
	}else {
		setTimeout(main(jQuery), timeout);
	}
 })();
 
 