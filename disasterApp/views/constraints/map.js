function(doc) {
    if (doc.type == 'constraint')
        emit(doc._id, doc);
};
