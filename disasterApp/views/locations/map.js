function(doc) {
    if (doc.type == 'location')
        emit(doc._id, doc);
};
