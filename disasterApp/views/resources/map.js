function(doc) {
    if (doc.type == 'resource')
        emit(doc._id, doc);
};
