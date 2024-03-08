tutorial_link: `https://www.youtube.com/watch?v=-56x56UppqQ&t=1246s`;

// open terminal shell
mongo;

// to create a new collection in database
db.createCollection('posts');

// to write new object in collection
db.posts.insert({
	title: 'Post One',
	body: 'Body of post one',
	category: 'News',
	likes: 4,
	tags: ['news', 'events'],
	user: {
		name: 'John Doe',
		status: 'author'
	},
	date: Date()
});

// to write more objects at once
db.posts.insertMany([
	{
		title: 'Post Two',
		body: 'Body of post two',
		category: 'Technology',
		date: Date()
	},
	{
		title: 'Post Three',
		body: 'Body of post three',
		category: 'News',
		date: Date()
	},
	{
		title: 'Post Four',
		body: 'Body of post four',
		category: 'Entertainment',
		date: Date()
	}
]);

// to query all data
db.posts.find();
db.posts.find().pretty(); // nicer to view

// to query with WHERE clause
db.posts.find({ category: 'News' });

// to sort query result (1 ascending, -1 descending)
db.posts.find().sort({ title: 1 });

// to count
db.posts.find({ category: 'News' }).count();

// get only first 10 results (lazy load)
db.posts.find().limit(10);

// of course, everything can be combined
db.posts
	.find()
	.sort({ title: -1 })
	.limit(5);

// PAGING (1st way)
db.posts.find().limit(10);					// page 1
db.posts.find().skip(10).limit(10);				// page 2
db.posts.find().skip(20).limit(10);				// page 3
db.posts.find().skip(pageSize * (n - 1)).limit(pageSize);	// generaly

// PAGING (2nd way)
db.posts.find({'_id'} > last_id).sort({ title: 1 }).limit(pageSize);
last_id = ...


// loop through query results
db.posts.find().forEach(doc => print(`Blog Post: ${doc.title}`));
db.posts.find().forEach(function(doc) {
	print('Blog Post: ' + doc.title);
}); // ES5

// to query specific row (returns the first match)
db.posts.findOne({ category: 'News' });

// to query specific row and to return just importnant fields, not the whole object (you need to put 1 or TRUE)
db.posts.find({ _id: ObjectId('4d0ada1fbb30773266f39fe4') }, { title: 1 });

// da prikazes sve sem titlea setujes title na 0 ili FALSE
db.posts.find({ _id: ObjectId('4d0ada1fbb30773266f39fe4') }, { title: 0 });

// to replace all the fields (first object is the WHERE clause, usually you want to query by id because of uniquness, but you can also put other fields like title, body etc.) (upsert -> if is not found the row, it will create a new one)
db.posts.update(
	{ _id: ObjectId('4d0ada1fbb30773266f39fe4') },
	{ title: 'Post Two', body: 'New post 2 body', date: Date() },
	{ upsert: true }
);

// update just needed fields, no replacment (set operator)
db.posts.update(
	{ _id: ObjectId('4d0ada1fbb30773266f39fe4') },
	{ $set: { body: 'Body of post 2', category: 'Technology' } }
);

// increment operator
db.posts.update(
	{ _id: ObjectId('4d0ada1fbb30773266f39fe4') },
	{ $inc: { likes: 2 } }
);

// rename operator
db.posts.update(
	{ _id: ObjectId('4d0ada1fbb30773266f39fe4') },
	{ $rename: { likes: 'views' } }
);

// delete
db.posts.remove({ _id: ObjectId('4d0ada1fbb30773266f39fe4') });

// embeed another collection in a collection (in SQL that's two tables with foreign key)
db.posts.update(
	{ _id: ObjectId('4d0ada1fbb30773266f39fe4') },
	{
		$set: {
			comments: [
				{ user: 'Mary Williams', body: 'Comment One', date: Date() },
				{ user: 'Harry White', body: 'Comment Two', date: Date() }
			]
		}
	}
);

// elemMatch operator
db.posts.find({ comments: { $elemMatch: { user: 'Mary Williams' } } });

// text search
db.posts.createIndex({ title: 'text' });
db.posts.find({ $text: { $search: '"Post T"' } }); // should returns objects Post Two & Post Three

// greather than & less than ($gt, $gte, $lt, $lte)
db.posts.find({ views: { $gt: 3 } });

// combine more parameters in a query
db.posts.find({ title: /^Post T/, views: { $lte: 6 } }, { title: 1, views: 1 });

// kondicioni operatori
let views_range = {};
views_range['$lt'] = 100;
views_range['$gt'] = 5;
db.posts.find({ title: /^P/, views: views_range }, { title: 1 });

// search by Date
db.posts.find({ date: { $lte: ISODate('2008-31-01') } });

/*
INDEKSI

Mongo ima ugrađenu podršku za indekse kako bi poboljšao performanse izvršavanja upita. Mongo podržava sledeće vrste struktura za indeksiranje:
->  B-stabla,
->  dvodimenzionalne geografske indekse i
->  sferične geografske indekse.


Svaki put kada je nova kolekcija kreirana, Mongo kreira indeks nad njenim poljem _id. Indeks za određenu kolekciju možete prikazati komandom getIndexes():
*/
db.posts.getIndexes();

// Pre nego što kreiramo indeks nad drugim poljima, valjalo bi da proverimo trenutnu brzinu izvršavanja upita, kako bismo kasnije mogli da proverimo unapređenje nakon dodavanja indeksa.
db.posts.find({ title: 'Post One' }).explain();
db.posts.find({ title: 'Post One' }).explain('executionStats'); // da vidimo samo deo koji nas posebno interesuje

// Sada ćemo kreirati indeks pozivanjem ensureIndex(fields,options) nad kolekcijom. Atribut fields prihvata objekat u kojem su definisana polja iz kolekcije nad kojima želimo da kreiramo indeks, a atribut options služi da odredimo vrstu indeksa koju želimo. U našem slučaju kreiraćemo jedinstveni indeks koji odbacuje duplikate nad poljem display.
db.posts.ensureIndex({ title: 1 }, { unique: true, dropDups: true });

// Sada ponovo pokušajte komandu find() od malopre kako bismo uočili unapređenje:
db.posts.find({ title: 'Post One' }).explain();

// Uspeli smo da sa 54 milisekundi spustimo izvršavanje upita na 0 milisekundi što je neverovatno ubrzanje. Ubrzanje je ostvareno tako što Mongo više ne mora da pretražuje celu kolekciju, već samo indeks, kako bi pronašao šta je traženo. Indekse takođe možemo kreirati i nad ugnježdenim podacima korišćenjem tačke, a savetuje se kreiranje indeksa u pozadini što se može uraditi korišćenjem opcije { background : 1 }:
db.posts.ensureIndex({ 'components.area': 1 }, { background: 1 });

