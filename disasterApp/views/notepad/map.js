function(doc) {
    if (doc.type == 'notepad')
        emit(doc.ownerId, doc);
};
