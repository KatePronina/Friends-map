VK.init({
	apiId: 6742681
});

function auth () {
	return new Promise ((resolve, reject) => {
		VK.Auth.login((data) => {
			if (data.session) {
				resolve();
			} else {
				reject();
			}
		}, 2)
	})
}

function callApi (method, params) {
	params.v = '5.87';

	return new Promise ((resolve, reject) => {
		VK.api(method, params, (data) => {
			if (data.error) {
				reject(data.error);
			} else {
				resolve(data.response);
			}
		})
	})
}

function geocode (address) {
	return ymaps.geocode(address).then((result) => {
		const points = result.geoObjects.toArray();

		if (points.length) {
			return points[0].geometry.getCoordinates();
		}
	});
}

let myMap;
let clusterer;
let usersData = [];

new Promise ((resolve) => {
	ymaps.ready(init);

	function init () {   
	    myMap = new ymaps.Map('map', {
	        center: [55.76, 37.64],
	        zoom: 3
	    });

	    clusterer = new ymaps.Clusterer({
	    	clusterDisableClickZoom: true,
	    	clusterBalloonContentLayout: 'cluster#balloonAccordion'
	    });

	    myMap.geoObjects.add(clusterer);

	   resolve(); 
	}	
})
.then(() => auth())
.then(() => callApi('friends.get', {fields: 'city, country'}))
.then((data) => {
	let friends = data.items.filter((elem) => {
		return elem.country && elem.country.title;
	})

	usersData = friends.map((elem) => {
		let friend = {};

		friend.name = elem.first_name + ' ' + elem.last_name;

		if (elem.city && elem.city.title) {
			friend.address = elem.country.title + ', ' + elem.city.title;
		} else {
			friend.address = elem.country.title;
		}

		return friend;
	})

	let coordsAddress = usersData.map((elem) => {
		return elem.address;		
	})
	.map(elem => geocode(elem));

	return Promise.all(coordsAddress);
})
.then((coords) => {
	for (let i = 0; i < usersData.length; i++) {
		usersData[i].coord = coords[i];
	}

	console.log(usersData);

	let myGeoObjects = [];

	for (let i = 0; i < usersData.length; i++) {

		let pin = new ymaps.GeoObject({
		    geometry: { type: 'Point', coordinates: usersData[i].coord },    properties: {
		        // clusterCaption: usersData[i].address,
		        balloonContentHeader: usersData[i].name,
		        balloonContentBody: usersData[i].address
		    }
		});
		
		myGeoObjects.push(pin);
	}

	clusterer.add(myGeoObjects);
})

