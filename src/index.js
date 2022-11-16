/**
 * Each cloud function is imported here.
 *
 * Within each cloud function, functions.http is called which creates the
 * cloud function and allows it to be registered as an endpoint.
 */
require('./photo/create');
require('./photo/get');
require('./photo/search');
