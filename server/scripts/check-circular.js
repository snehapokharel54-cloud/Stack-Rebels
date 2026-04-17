import madge from 'madge';

madge('src/app.js').then((res) => {
	console.log('Circular dependencies:');
	console.log(res.circular());
});
