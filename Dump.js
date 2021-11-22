const axios = require('axios');
var fs = require('fs');

/*
	Хорошо бы вам было сюда свою cookie установить предварительно зайдя с браузера по адресу http://bbk.rsl.ru/external/bbk?block=ETALON
*/
const cookie = "JSESSIONID=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
const after_error_wait_time = 1000;

const headers = {
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Accept-Encoding": "gzip, deflate",
    "Accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
    "Connection": "keep-alive",
    "Content-type": "application/x-www-form-urlencoded; charset=UTF-8",
    "Host": "bbk.rsl.ru",
    "Origin": "http://bbk.rsl.ru",
    "X-requested-with": "XMLHttpRequest",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36",
    "Referer": "http://bbk.rsl.ru/external/bbk?block=ETALON"
};

if(cookie=='JSESSIONID=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'){
	console.log('Необходимо установить cookie.')
	process.exit()
}

async function getChilds(id = 0){
	const params = new URLSearchParams();
	params.append('internal_table_id', '');
	params.append('block', 'ETALON');
	params.append('id', id.toString());
	const response = await axios.post('http://bbk.rsl.ru/ajax/bbk/load', params, {
		headers: {
		    ...headers,
			"Content-Length" : params.toString().length.toString(),
			"Cookie": cookie,
		}
	});
	return await response.data[1];
}

let Dump = [];

function sleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

async function load(_id=0){
	try{
		let data = await getChilds(_id);
		for(let e of data){
			let {id, index, caption, folder, parentId} = e;
			Dump.push({id, index, caption, folder, parentId});
			console.log('Caption: ', caption);
			console.log('Сумарное количество записей: ', Dump.length);
			if(folder){
				await load(id);
			}
		}
	}catch(e){
		console.log('Ашибка. Пробуем снова через секунду.');
		await sleep(after_error_wait_time);
		load(id);
	}
}

/*
	Можно было дозаписывать в конец файла, но это не имеет особого смысла так как пиковая память процесса дампа не превышала 60мб, а сумарный размер дампа 4.6 мб.
*/
load().then(()=>{
	fs.writeFile('./Dump.json', JSON.stringify(Dump), (error)=>{
		if(error){
			console.error('Error:', error);
		}
    })
})