function(doc, req) {
    if (doc.type == 'message')
	return true;

    return false;
}
