function(doc) {
    if (doc.type == 'volunteer')
        emit(doc._id, doc);
};
