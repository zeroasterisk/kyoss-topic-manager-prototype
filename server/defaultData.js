if (Topic.find({}).count() == 0) {
  // default topics
  Topic.insert({
    name:   'Git',
    short:  'Git is a distributed version control system',
    desc:  'Git is easy to learn and has a tiny footprint with lightning fast performance. It outclasses SCM tools like Subversion, CVS, Perforce, and ClearCase with features ...',
    url:  'http://git-scm.com',
    tags: 'tool',
  });
  Topic.insert({
    name:   'MeteorJS',
    short:  'Meteor is an open-source platform for building top-quality web apps in a fraction of the time, whether you\'re an expert developer or just getting started.',
    desc:  '“So why should you spend your time learning Meteor rather than another web framework? Leaving aside all the various features of Meteor, we believe it boils down to one thing: Meteor is easy to learn.” - Discover Meteor',
    url:  'http://meteor.com',
    tags: 'js nodejs framework webapp',
  });
  Topic.insert({
    name:   'UnderscoreJS',
    short:  'Underscore is a JavaScript library that provides a whole mess of useful functional programming helpers without extending any built-in objects.',
    desc:  'Underscore provides 80-odd functions that support both the usual functional suspects: map, select, invoke — as well as more specialized helpers: function binding, javascript templating, deep equality testing, and so on. It delegates to built-in functions, if present, so modern browsers will use the native implementations of forEach, map, reduce, filter, every, some and indexOf.',
    url:  'http://underscorejs.org',
    tags: 'js nodejs utility',
  });
  Topic.insert({
    name:   'Vert.x',
    short:  'Vert.x is a lightweight, high performance application platform for the JVM that\'s designed for modern mobile, web, and enterprise applications.',
    desc:  'Polyglot (Write your application components in Java, JavaScript, CoffeeScript, Ruby, Python or Groovy... or mix and match several programming languages in a single app.) & Scaleable (Scales using messaging passing to efficiently utilise your server cores.  Uses non blocking I/O to serve many connections with minimal threads.)',
    url:  'http://underscorejs.org',
    tags: 'framework java jvm python nodejs',
  });
  Topic.insert({
    name:   'Agile Dev',
    short:  'Agile software development is a group of software development methods in which requirements and solutions evolve through collaboration between self-organizing, cross-functional teams.',
    desc:  'It promotes adaptive planning, evolutionary development, early delivery, continuous improvement and encourages rapid and flexible response to change. It is a conceptual framework that focuses on delivering working software with the minimum amount of work.',
    url:  'http://en.wikipedia.org/wiki/Agile_software_development',
    tags: 'tool development philosophy',
  });
}
