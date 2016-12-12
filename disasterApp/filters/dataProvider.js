function(doc, req) {
    if (doc.type == 'patient'
	    || doc.type == 'volunteer'
	    || doc.type == 'resource'
	    || doc.type == 'location'
	    || doc.type == 'registry'
	    || doc.type == 'journal')
	return true;

    return false;
}
