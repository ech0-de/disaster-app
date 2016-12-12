function(doc) {
    if (doc.type == 'registry')
        emit(doc.patientId, doc);
};
