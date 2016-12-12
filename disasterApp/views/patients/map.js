function(doc) {
    if (doc.type == 'patient')
        emit(doc._id, doc);
};
