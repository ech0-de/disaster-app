var app = angular.module('DisasterAreaNetworkApplication', [
    'pascalprecht.translate',
    'mobile-angular-ui',
    'leaflet-directive',
    'luegg.directives',
    'ngStorage',
    'ngRoute',
]);

//{{{ dataProvider
app.factory('dataProvider', function($http) {
    var sortings = [{
        class: 'btn-danger',
        text: 'SORTING_1'
    }, {
        class: 'btn-warning',
        text: 'SORTING_2'
    }, {
        class: 'btn-success',
        text: 'SORTING_3'
    }, {
        class: 'btn-primary',
        text: 'SORTING_4'
    }, {
        class: 'btn-black',
        text: 'SORTING_5'
    }];

    var transportations = [{
        class: 'fa-bed',
        text: 'LYING'
    }, {
        class: 'fa-wheelchair',
        text: 'SITTING'
    }, {
        class: 'fa-user-md',
        text: 'WITH_DOCTOR'
    }, {
        class: 'fa-shield',
        text: 'ISOLATED'
    }, {
        class: 'fa-plus',
        text: 'PRIORITY_A'
    }, {
        class: 'fa-minus',
        text: 'PRIORITY_B'
    }];

    var diagnoses = [{
        icon: 'fa-medkit',
        class: 'btn-default',
        text: 'INJURY',
    }, {
        icon: 'fa-fire',
        class: 'btn-danger',
        text: 'BURN',
    }, {
        icon: 'fa-heartbeat',
        class: 'btn-info',
        text: 'DISEASE',
    }, {
        icon: 'fa-eyedropper',
        class: 'btn-success',
        text: 'INTOXICATION',
    }, {
        icon: 'fa-sun-o',
        class: 'btn-warning',
        text: 'EXCESSIVE_RADIATION',
    }, {
        icon: 'fa-user',
        class: 'btn-primary',
        text: 'PSYCHIC_CONDITION',
    }];

    // list of nationalities, thanks to https://gist.github.com/zspine/2365808
    var nationalities = [
        'AD', 'AE', 'AF', 'AI', 'AM', 'AO', 'AQ', 'AR', 'AS', 'AU', 'AW', 'BA',
        'BB', 'BE', 'BH', 'BM', 'BO', 'BR', 'BS', 'BT', 'BU', 'BY', 'BZ', 'CA',
        'CG', 'CH', 'CH', 'CL', 'CM', 'CM', 'CO', 'CR', 'CR', 'CU', 'CY', 'DE',
        'DK', 'DM', 'EC', 'EE', 'EG', 'ET', 'FI', 'FJ', 'FR', 'GB', 'GE', 'GH',
        'GN', 'GR', 'GY', 'HK', 'HR', 'HU', 'ID', 'IE', 'IN', 'IQ', 'IR', 'IS',
        'IS', 'IT', 'JM', 'JO', 'JP', 'KE', 'KO', 'KW', 'KZ', 'LB', 'LK', 'LT',
        'LU', 'MA', 'MC', 'ME', 'MM', 'MN', 'MU', 'MV', 'MY', 'NA', 'NG', 'NL',
        'NO', 'NP', 'NZ', 'OM', 'PA', 'PE', 'PH', 'PK', 'PO', 'PT', 'PY', 'QA',
        'RO', 'RU', 'SA', 'SC', 'SE', 'SG', 'SK', 'SN', 'SO', 'SP', 'TH', 'TN',
        'TR', 'TW', 'TZ', 'UA', 'UG', 'US', 'UY', 'UZ', 'VE', 'VN', 'YE', 'ZA',
        'ZM', 'ZW'
    ];

    var consciousness = [
	'',
	'ORIENTED',
	'CLOUDED',
	'UNCONSCIOUSNESS',
    ];

    var respiration = [
	'',
	'SPONTANEOUSLY_FREELY',
	'RESPIRATORY DISTRESS',
	'HYPERVENTILATION',
	'RESPIRATORY ARREST',
	'CIRCULATION',
    ];

    var circulation = [
	'',
	'CIRCULATORY_SHOCK',
	'CIRCULATORY ARREST',
	'PULSE_REGULARLY',
	'PULSE_UNREGULARLY',
    ];

    var pain = [
	'',
	'NONE',
	'MEDIUM',
	'STRONG',
    ];

    var transmissions = [
	'RADIO',
	'PHONE',
	'FAX',
	'MESSENGER'
    ];

    var ranks = [{
        icon: 'fa-train',
        text: 'PLATOON_LEADER'
    }, {
        icon: 'fa-users',
        text: 'GROUP_LEADER',
    }, {
        icon: 'fa-user-secret',
        text: 'VOLUNTEER'
    }];

    var lastSeq = 0;
    var data = {
	patient: {},
	volunteer: {},
	resource: {},
	location: {},
	registry: {},
	journal: {}
    };

    var arrays = {};
    Object.keys(data).forEach(function(k) {
	arrays[k] = [];
    });

    var patientRegistry = {};

    var getData = function() {
	$http.get('/disaster-app/_changes?feed=longpoll&include_docs=true&filter=disasterApp/dataProvider&since=' + lastSeq).success(function(res) {
	    var reArraylize = [];
	    res.results.forEach(function(msg) {
		data[msg.doc.type][msg.doc._id] = msg.doc;
		if (reArraylize.indexOf(msg.doc.type) < 0)
		    reArraylize.push(msg.doc.type);

		if (msg.doc.type == 'registry') {
		    if (!patientRegistry[msg.doc.patientId])
			patientRegistry[msg.doc.patientId] = msg.doc;

		    if (!patientRegistry[msg.doc.patientId].timestamp || patientRegistry[msg.doc.patientId].timestamp < msg.doc.timestamp) {
			patientRegistry[msg.doc.patientId].timestamp = msg.doc.timestamp;
			patientRegistry[msg.doc.patientId].patientId = msg.doc.patientId;
			patientRegistry[msg.doc.patientId].locationId = msg.doc.locationId;
		    }
		} else if (msg.doc.type == 'patient') {
		    if (!patientRegistry[msg.doc._id]) {
			patientRegistry[msg.doc._id] = { sorting: msg.doc.sorting.text, patientNumber: msg.doc.patientNumber };
			return;
		    }
		    patientRegistry[msg.doc._id].sorting = msg.doc.sorting.text;
		    patientRegistry[msg.doc._id].patientNumber = msg.doc.patientNumber;
		}
	    });

	    reArraylize.forEach(function(k) {
		// clear and refill array
		arrays[k].length = 0;
		Object.keys(data[k]).forEach(function(o) {
		    arrays[k].push(data[k][o]);
		});
	    });

	    // repeat the request with new last_seq
	    lastSeq = res.last_seq;
	    getData();
	}).error(function() {
	    // if request fails, repeat the request
	    getData();
	});
    };
    getData();

    return {
	getSortings: function() {
	    return sortings;
	},
	getTransportations: function() {
	    return transportations;
	},
	getDiagnoses: function() {
	    return diagnoses;
	},
	getNationalities: function() {
	    return nationalities;
	},
	getConsciousness: function() {
	    return consciousness;
	},
	getRespiration: function() {
	    return respiration;
	},
	getCirculation: function() {
	    return circulation;
	},
	getPain: function() {
	    return pain;
	},
	getTransmissions: function() {
	    return transmissions;
	},
	getRanks: function() {
	    return ranks;
	},
	getPatients: function(asArray) {
	    if (asArray)
		return arrays.patient;
	    return data.patient;
	},
	getVolunteers: function(asArray) {
	    if (asArray)
		return arrays.volunteer;
	    return data.volunteer;
	},
	getResources: function(asArray) {
	    if (asArray)
		return arrays.resource;
	    return data.resource;
	},
	getLocations: function(asArray) {
	    if (asArray)
		return arrays.location;
	    return data.location;
	},
	getRegistry: function(asArray) {
	    if (asArray)
		return arrays.registry;
	    return data.registry;
	},
	getJournal: function(asArray) {
	    if (asArray)
		return arrays.journal;
	    return data.journal;
	},
	getPatientRegistry: function() {
	    return patientRegistry;
	},
    };
});
//}}}

//{{{ directives
//{{{ directive: modalBody
app.directive('modalBody', function() {
    return {
	restrict: 'C',
	controller: ['$element', 'allowTouchmoveDefault', function($element, allowTouchmoveDefault) {

	    var getTouchY = function(event) {
		var touches = event.touches && event.touches.length ? event.touches : [event];
		var e = (event.changedTouches && event.changedTouches[0]) ||
		    (event.originalEvent && event.originalEvent.changedTouches &&
			event.originalEvent.changedTouches[0]) || touches[0].originalEvent || touches[0];

		return e.clientY;
	    };

	    var scrollableContent = $element[0],
	    scrollable = $element.parent()[0];

	    // Handle nobounce behaviour
	    if ('ontouchmove' in document) {
		var allowUp, allowDown, prevTop, prevBot, lastY;
		var setupTouchstart = function(event) {
		    allowUp = (scrollableContent.scrollTop > 0);

		    allowDown = (scrollableContent.scrollTop < scrollableContent.scrollHeight - scrollableContent.clientHeight);
		    prevTop = null; 
		    prevBot = null;
		    lastY = getTouchY(event);
		};

		$element.on('touchstart', setupTouchstart);
		$element.on('$destroy', function() {
		    $element.off('touchstart');
		});

		allowTouchmoveDefault($element, function(event) {
		    var currY = getTouchY(event);
		    var up = (currY > lastY), down = !up;
		    lastY = currY;
		    return (up && allowUp) || (down && allowDown);
		});
	    }

	    this.scrollableContent = scrollableContent;
	    this.scrollTo = function(elementOrNumber, marginTop) {
		marginTop = marginTop || 0;

		if (angular.isNumber(elementOrNumber)) {
		    scrollableContent.scrollTop = elementOrNumber - marginTop;
		} else {
		    var target = angular.element(elementOrNumber)[0];
		    if ((! target.offsetParent) || target.offsetParent === scrollable) {
			scrollableContent.scrollTop = target.offsetTop - marginTop;
		    } else {
			// recursively subtract offsetTop from marginTop until it reaches scrollable element.
			this.scrollTo(target.offsetParent, marginTop - target.offsetTop);
		    }
		}
	    };
	}],
	link: function(scope, element) {
	    if (overthrow.support !== 'native') {
		element.addClass('overthrow');
		overthrow.forget();
		overthrow.set();
	    }
	}
    };
});
// }}}

//{{{ directive: volunteer
app.directive('volunteer', function(dataProvider) {
    return {
        restrict: 'A',
	scope: { volunteer: '=' },
	templateUrl: 'templates/directives/volunteer.html',
        link: function(scope, element) {
	    scope.ranks = {};
	    dataProvider.getRanks().forEach(function(rank) {
		scope.ranks[rank.text] = rank.icon
	    });
	    scope.resources = dataProvider.getResources();
	    scope.locations = dataProvider.getLocations();

	    // TODO handle no volunteer?
	    //console.log(scope.volunteer);
        }
    };
});
//}}}

//{{{ directive: autoFocus
app.directive('autoFocus', function($timeout) {
    return {
        restrict: 'AC',
        link: function(_scope, _element) {
            $timeout(function() {
		_element[0].focus();
            }, 0);
        }
    };
});
//}}}

//{{{ directive: bodySketch
app.directive('bodySketch', function($timeout, $window) {
    return {
        restrict: 'C',
        link: function(scope, element) {
	    var resize = function() {
		scope.patient.diagnoses.forEach(function(diagnose) {
		    diagnose.style.left = (diagnose.target.left * element[0].clientWidth - 17);
		    diagnose.style.top = (diagnose.target.top * element[0].clientHeight);

		    diagnose.style.left = Math.min(diagnose.style.left, element[0].clientWidth - 60);
		    diagnose.style.top = Math.min(diagnose.style.top, element[0].clientHeight - 60);

		    diagnose.style.left = diagnose.style.left + 'px';
		    diagnose.style.top = diagnose.style.top + 'px';
		});
	    
		$timeout(function() {
		    scope.$apply();
		});
	    };

	    angular.element($window).bind('resize', resize);
            scope.$watch('patient.diagnoses', resize);
        }
    };
});
//}}}

//{{{ directive: chkbutton
app.directive('chkbutton', function() {
    return {
        scope: {
            model: '=',
            icon: '@'
        },
        restrict: 'E',
        transclude: true,
	template: '<button class="btn btn-default" ng-click="model=!model"><i ng-class="icon"></i><span ng-transclude></span></button>',
        link: function(scope, element) {
            scope.$watch('model', function(newValue, oldValue) {
                if (newValue)
                    element.children().addClass('btn-success').removeClass('btn-default');
                else
                    element.children().addClass('btn-default').removeClass('btn-success');

		element.children()[0].blur();
            });
        }
    };
});
//}}}

//{{{ directive: capitalize
app.directive('capitalize', function() {
    return {
	require: 'ngModel',
	link: function(scope, element, attrs, modelCtrl) {
	    var capitalize = function(inputValue) {
		if (inputValue == undefined)
		    inputValue = '';

		var capitalized = inputValue.toUpperCase();
		if (capitalized !== inputValue) {
		    modelCtrl.$setViewValue(capitalized);
		    modelCtrl.$render();
		}

		return capitalized;
	    };

	    modelCtrl.$parsers.push(capitalize);

	    // capitalize initial value
	    capitalize(scope[attrs.ngModel]);
	}
    };
});
//}}}
//}}}
//{{{ filter: reverse
app.filter('reverse', function() {
    return function(items) {
        return items.slice().reverse();
    };
});
//}}}

//{{{ app.config
app.config(function($routeProvider, $translateProvider) {
    $routeProvider.when('/messages', {
        templateUrl: 'templates/messages.html',
        reloadOnSearch: false
    }).when('/patients', {
        controller: 'PatientsController',
        templateUrl: 'templates/patients.html',
        reloadOnSearch: false
    }).when('/patient/:id', {
        controller: 'PatientController',
        templateUrl: 'templates/patient.html',
        reloadOnSearch: false
    }).when('/registry', {
        controller: 'RegistryController',
        templateUrl: 'templates/registry.html',
        reloadOnSearch: false
    }).when('/settings', {
        controller: 'SettingsController',
        templateUrl: 'templates/settings.html',
        reloadOnSearch: false
    }).when('/notepad', {
        controller: 'NotepadController',
        templateUrl: 'templates/notepad.html',
        reloadOnSearch: false
    }).when('/registration-card', {
        controller: 'RegistrationCardController',
        templateUrl: 'templates/registration-card.html',
        reloadOnSearch: false
    }).when('/admin/statistics', {
        controller: 'StatisticsController',
        templateUrl: 'templates/admin/statistics.html',
        reloadOnSearch: false
    }).when('/admin/location', {
        controller: 'LocationController',
        templateUrl: 'templates/admin/location.html',
        reloadOnSearch: false
    }).when('/admin/volunteers', {
        controller: 'VolunteersController',
        templateUrl: 'templates/admin/volunteers.html',
        reloadOnSearch: false
    }).when('/admin/volunteer/:id', {
        controller: 'VolunteerController',
        templateUrl: 'templates/admin/volunteer.html',
        reloadOnSearch: false
    }).when('/admin/resources', {
        controller: 'ResourcesController',
        templateUrl: 'templates/admin/resources.html',
        reloadOnSearch: false
    }).when('/admin/resource/:id', {
        controller: 'ResourceController',
        templateUrl: 'templates/admin/resource.html',
        reloadOnSearch: false
    }).when('/admin/journal', {
        controller: 'JournalController',
        templateUrl: 'templates/admin/journal.html',
        reloadOnSearch: false
    }).otherwise({
        redirectTo: '/messages'
    });

    $translateProvider.translations('en', {
	// global
        'CLOSE': 'Close',
        'EDIT': 'Edit',
        'CANCEL': 'Cancel',
        'SAVE': 'Save',
        'DELETE': 'Delete',
        'NOTES': 'Notes',

        // sidebar
        'MESSAGES': 'Messages',
        'PATIENTS': 'Patients',
        'NOTEPAD': 'Notepad',
        'PATIENT_REGISTRY': 'Patient Registry',
        'SETTINGS': 'Settings',
        'ADMINISTRATION': 'Administration',
        'STATISTICS': 'Statistics',
        'LOCATIONS': 'Locations',
        'VOLUNTEERS': 'Volunteers',
        'OPERATIONAL_RESOURCES': 'Operational Resources',
        'REGISTRATION_CARD': 'Registration Card',
        'OPERATION_JOURNAL': 'Operation Journal',
        'PREFERENCES': 'Preferences',

	// messages
        'MESSAGE': 'Message',

	// notepad
        'OF': 'of',
        'REMAINING': 'remaining',
        'ADD_NEW_NOTE': 'add new note',
        'ADD': 'Add',

	// patients
        'SEARCH': 'Search',
        'ADD_PATIENT': 'Add Patient',

	// patient
        'PATIENT': 'Patient',
        'SAVE_PATIENT': 'Save Patient',
        'SORTING': 'Sorting',
        'REGISTRATION_CARD_FOR_INJURED_SICK_PERSONS': 'Registration card for injured/sick persons',
        'DATE_OF_BIRTH_AGE': 'Date of birth/~age',
        'REMARKS': 'Remarks',
        'PLACE_OF_FINDING': 'Place of finding',
        'DATE_TIME': 'Date, Time',
        'TRANSPORTATION_1': 'Transportation',
        'TRANSPORTATION_2': 'Transportation',
        'DESTINATION': 'Destionation',
        'WHEREABOUTS': 'Whereabout',
        'SORTING_LOG': 'Sorting log',
        'SHORT_DIAGNOSE': 'Short diagnose',
	'TRANSPORTATION_FOR_PATIENT': 'Transportation for patient',
	'LYING': 'lying',
	'SITTING': 'sitting',
	'WITH_DOCTOR': 'with doctor',
	'ISOLATED': 'isolated',
	'PRIORITY_A': 'Priority a',
	'PRIORITY_B': 'Priority b',
	'SORTING_FOR_PATIENT': 'Sorting for patient',
	'SORTING_1': 'I - immediate treatment',
	'SORTING_2': 'II - delayed treatment',
	'SORTING_3': 'III - minimal treatment',
	'SORTING_4': 'IV - expectant treatment',
	'SORTING_5': 'dead',
	'NOT_SORTED_YET': 'Not sorted yet',
	'REGISTRY': 'Registry',
	'SHORT_DIAGNOSE_FOR_PATIENT': 'Short diagnose for patient',
	'INJURY':'injury',
	'BURN':'burn',
	'DISEASE':'disease',
	'INTOXICATION':'intoxication',
	'EXCESSIVE_RADIATION':'excessive radiation',
	'PSYCHIC_CONDITION':'physic condition',
	'CONSCIOUSNESS':'consciousness',
	    'ORIENTED':'oriented',
	    'CLOUDED':'clouded',
	    'UNCONSCIOUSNESS':'unconsciousness',
	'RESPIRATION':'respiration',
	    'SPONTANEOUSLY_FREELY':'spontaneously freely',
	    'RESPIRATORY DISTRESS':'respiratory distress',
	    'HYPERVENTILATION':'hyperventilation',
	    'RESPIRATORY ARREST':'respiratory arrest',
	'CIRCULATION':'circulation',
	    'CIRCULATORY_SHOCK':'circulatory shock',
	    'CIRCULATORY ARREST':'circulatory arrest',
	    'PULSE_REGULARLY':'pulse regularly',
	    'PULSE_UNREGULARLY':'pulse unregularly',
	'PAIN':'pain',
	    'NONE':'none',
	    'MEDIUM':'medium',
	    'STRONG':'strong',

	// patient registry
        'SIGN_IN': 'Sign in',
        'PATIENT_NUMBER': 'Patient number',
        'TIMESTAMP': 'Timestamp',
        'CHOOSE_PATIENT': 'Choose patient',

        // settings
        'SAVE_SETTINGS': 'Save settings',
        'IDENTITY': 'Identity',
        'DEVICE_SETTINGS': 'Device settings',
        'LANGUAGE': 'Language',
        'CHOOSE_IDENTITY': 'Choose Identity',

        'SUCCESS': 'Success',
        'YOUR_SETTINGS_WERE_SUCCESSFULLY_SAVED_TO_THE_DEVICE': 'Your settings were successfully saved to the device',

        // registration card
        'REGISTRATION_CARD_FOR_VOLUNTEERS': 'Registration card for volunteers',
        'NAME': 'Name',
        'FIRST_NAME': 'First name',
        'DATE_OF_BIRTH': 'Date of birth',
        'GENDER': 'Gender',
        'RELIGION': 'Religion',
        'RESIDENCE': 'Residence',
        'NATIONALITY': 'Nationality',
        'STREET': 'Street',
        'N_OF_IDENTITY_DISK': 'N° of identity disk',
        'DISTRICT_BRANCH': 'District Branch',
        'RED_CROSS_UNIT': 'Red Cross unit',
        'PLACE_OF_ACTION': 'Place of action',
        'DISASTER_PREPAREDNESS_UNIT': 'Disaster preparedness unit',
        'START_OF_ACTION': 'Start of action',
        'END_OF_ACTION': 'End of action',
        'RANK': 'Rank',

        'WARNING': 'Warning',
        'START_ACTION': 'Start action',
        'NO_REGISTRATION_CARD_FOUND': 'No Registration Card found, please fill out one first.',

        // resources
        'OPERATIONAL_RESOURCE': 'Operational Resource',
	'ADD_OPERATIONAL_RESOURCE': 'Add Operational Resource',
	'SAVE_RESOURCE': 'Save Resource',
	'CALL_SIGN': 'Call Sign',
	'RESOURCE_TYPE': 'Resource Type',
	'SEATS': 'Seats',
	'ADD_SEAT': 'Add Seat',
	'SEAT': 'Seat',
	'SELECT': '- SELECT -',

	// staging
        'REGISTRATION_CARD_FOR_VOLUNTEER': 'Registration card for volunteer',

	// locations
        'LOCATION': 'Location',
	'ADD_LOCATION': 'Add Location',
	'EDIT_LOCATION': 'Edit Location',

	// journal
	'ADD_ENTRY': 'Add entry',
	'SHOW_ENTRY_FROM': 'Show entry from',
	'AT': 'um',
	'SERIAL_NUMBER': 'ser. no.',
	'DATETIME': 'date / time',
	'TRANSMISSION': 'transmission',
	    'RADIO': 'Radio',
	    'PHONE': 'Phone',
	    'FAX': 'Fax',
	    'MESSENGER': 'Messenger',
	'SENDER': 'sender',
	'RECIPIENT': 'recipient',
	'EVENT': 'message',
	'EVENT_LONG': 'event / message / measure',
	'AUTHOR': 'author',

	// statistics
	'PATIENT_STATISTIC' : 'Patient statistic',
	'VOLUNTEER_STATISTIC' : 'Volunteer statistic',
	'SUM' : 'sum',
	'STRENGTH' : 'strength',
	'PLATOON_LEADER': 'Platoon leader',
	'GROUP_LEADER': 'Group leader',
	'VOLUNTEER': 'Volunteer',

        // nationalities
        // thanks to https://gist.github.com/zspine/2365808
        'AD': 'Andorian',
        'AE': 'Emirian',
        'AF': 'Afghani',
        'AI': 'Anguillan',
        'AM': 'Armenian',
        'AO': 'Angolian',
        'AQ': 'Antarctic',
        'AR': 'Argentine',
        'AS': 'Austrian',
        'AU': 'Australian',
        'AW': 'Arubian',
        'BA': 'Bangladeshi',
        'BB': 'Barbadian',
        'BE': 'Belgian',
        'BH': 'Bahrainian',
        'BM': 'Bermuda',
        'BO': 'Bolivian',
        'BR': 'Brazilian',
        'BS': 'Bahameese',
        'BT': 'Bhutanese',
        'BU': 'Bulgarian',
        'BY': 'Belarusian',
        'BZ': 'Belizean',
        'CA': 'Canadian',
        'CG': 'Congolese',
        'CH': 'Chinese',
        'CH': 'Swiss',
        'CL': 'Chilean',
        'CM': 'Cambodian',
        'CM': 'Cameroonian',
        'CO': 'Columbian',
        'CR': 'Czech',
        'CR': 'Costa Rican',
        'CU': 'Cuban',
        'CY': 'Cypriot',
        'DE': 'German',
        'DK': 'Danish',
        'DM': 'Dominican',
        'EC': 'Ecuadorean',
        'EE': 'Estonian',
        'EG': 'Egyptian',
        'ET': 'Ethiopian',
        'FI': 'Finnish',
        'FJ': 'Fijian',
        'FR': 'French',
        'GB': 'British',
        'GE': 'Georgian',
        'GH': 'Ghanaian',
        'GN': 'Guinean',
        'GR': 'Greek',
        'GY': 'Guyanese',
        'HK': 'Chinese',
        'HR': 'Croatian',
        'HU': 'Hungarian',
        'ID': 'Indonesian',
        'IE': 'Irish',
        'IN': 'Indian',
        'IQ': 'Iraqi',
        'IR': 'Iranian',
        'IS': 'Israeli',
        'IS': 'Icelander',
        'IT': 'Italian',
        'JM': 'Jamaican',
        'JO': 'Jordanian',
        'JP': 'Japanese',
        'KE': 'Kenyan',
        'KO': 'Korean',
        'KW': 'Kuwaiti',
        'KZ': 'Kazakhstani',
        'LB': 'Lebanese',
        'LK': 'Sri Lankan',
        'LT': 'Lithunian',
        'LU': 'Luxembourger',
        'MA': 'Moroccan',
        'MC': 'Monacan',
        'ME': 'Mexican',
        'MM': 'Mayanmarese',
        'MN': 'Mongolian',
        'MU': 'Mauritian',
        'MV': 'Maldivan',
        'MY': 'Malaysian',
        'NA': 'Namibian',
        'NG': 'Nigerian',
        'NL': 'Dutch',
        'NO': 'Norwegian',
        'NP': 'Nepalese',
        'NZ': 'New Zealander',
        'OM': 'Omani',
        'PA': 'Panamanian',
        'PE': 'Peruvian',
        'PH': 'Filipino',
        'PK': 'Pakistani',
        'PO': 'Polish',
        'PT': 'Portugees',
        'PY': 'Paraguayan',
        'QA': 'Qatari',
        'RO': 'Romanian',
        'RU': 'Russian',
        'SA': 'Saudi Arabian',
        'SC': 'Seychellois',
        'SE': 'Swedish',
        'SG': 'Singaporean',
        'SK': 'Slovakian',
        'SN': 'Senegalese',
        'SO': 'Somali',
        'SP': 'Spanish',
        'TH': 'Thai',
        'TN': 'Tunisian',
        'TR': 'Turkish',
        'TW': 'Taiwanese',
        'TZ': 'Tanzanian',
        'UA': 'Ukrainian',
        'UG': 'Ugandan',
        'US': 'American',
        'UY': 'Uruguayan',
        'UZ': 'Uzbekistani',
        'VE': 'Venezuelan',
        'VN': 'Vietnamese',
        'YE': 'Yemeni',
        'ZA': 'South African',
        'ZM': 'Zambian',
        'ZW': 'Zimbabwean'
    });

    $translateProvider.translations('de', {
	// global
        'CLOSE': 'Schließen',
        'EDIT': 'Bearbeiten',
        'CANCEL': 'Abbrechen',
        'SAVE': 'Speichern',
        'DELETE': 'Löschen',
        'NOTES': 'Bemerkungen',

        // sidebar
        'MESSAGES': 'Nachrichten',
        'PATIENTS': 'Patienten',
        'NOTEPAD': 'Notizbuch',
        'PATIENT_REGISTRY': 'Patienten Registrierung',
        'SETTINGS': 'Einstellungen',
        'ADMINISTRATION': 'Administration',
        'STATISTICS': 'Statistiken',
        'LOCATIONS': 'Standorte',
        'VOLUNTEERS': 'Einsatzkräfte',
        'OPERATIONAL_RESOURCES': 'Einsatzmittel',
        'REGISTRATION_CARD': 'Meldekarte',
        'OPERATION_JOURNAL': 'Einsatztagebuch',
        'PREFERENCES': 'Voreinstellungen',

	// messages
        'MESSAGE': 'Nachricht',

	// notepad
        'OF': 'von',
        'REMAINING': 'verbleibend',
        'ADD_NEW_NOTE': 'Neue Notiz',
        'ADD': 'Hinzufügen',

	// patients
        'SEARCH': 'Suche',
        'ADD_PATIENT': 'Patient hinzufügen',
        'SORTING': 'Sichtung',
        'REGISTRATION_CARD_FOR_INJURED_SICK_PERSONS': 'Anhängekarte für Verletzte/Kranke',
        'DATE_OF_BIRTH_AGE': 'Geburtsdatum/~Alter',
        'REMARKS': 'Bemerkungen',
        'PLACE_OF_FINDING': 'Fundort',
        'DATE_TIME': 'Datum, Uhrzeit',
        'TRANSPORTATION_1': 'Transportmittel',
        'TRANSPORTATION_2': 'Transport',
        'DESTINATION': 'Transportziel',
        'WHEREABOUTS': 'Verbleib',
        'SORTING_LOG': 'Sichtungsprotokoll',
        'SHORT_DIAGNOSE': 'Kurz-Diagnose',
	'TRANSPORTATION_FOR_PATIENT': 'Transport für Patient',
	'LYING': 'liegend',
	'SITTING': 'sitzend',
	'WITH_DOCTOR': 'mit Notarzt',
	'ISOLATED': 'isoliert',
	'PRIORITY_A': 'Priorität a',
	'PRIORITY_B': 'Priorität b',
	'SORTING_FOR_PATIENT': 'Sichtung für Patient',
	'SORTING_1': 'I - Sofortbehandlung',
	'SORTING_2': 'II - Verzögerte Behandlung',
	'SORTING_3': 'III - Minimale Behandlung',
	'SORTING_4': 'IV - abwartende Behandlung',
	'SORTING_5': 'Tot',
	'NOT_SORTED_YET': 'Ungesichtet',
	'REGISTRY': 'Registierung',
	'SHORT_DIAGNOSE_FOR_PATIENT': 'Kurz-Diagnose für Patient',
	'INJURY':'Verletzung',
	'BURN':'Verbrennung',
	'DISEASE':'Erkrankung',
	'INTOXICATION':'Vergiftung',
	'EXCESSIVE_RADIATION':'Verstrahlung',
	'PSYCHIC_CONDITION':'Psyche',
	'CONSCIOUSNESS':'Bewusstsein',
	    'ORIENTED':'orientiert',
	    'CLOUDED':'getrübt',
	    'UNCONSCIOUSNESS':'bewusstlos',
	'RESPIRATION':'Atmung',
	    'SPONTANEOUSLY_FREELY':'spontan / frei',
	    'RESPIRATORY DISTRESS':'Atemnot',
	    'HYPERVENTILATION':'Hyperventilation',
	    'RESPIRATORY ARREST':'Atemstillstand',
	'CIRCULATION':'Kreislauf',
	    'CIRCULATORY_SHOCK':'Schock',
	    'CIRCULATORY ARREST':'Kreislaufstillstand',
	    'PULSE_REGULARLY':'Puls regelmäßig',
	    'PULSE_UNREGULARLY':'Puls unregelmäßig',
	'PAIN':'Schmerzen',
	    'NONE':'keine',
	    'MEDIUM':'mittelstarke',
	    'STRONG':'starke',

	// patient
        'PATIENT': 'Patient',
        'SAVE_PATIENT': 'Patient speichern',

	// patient registry
        'SIGN_IN': 'Registrieren',
        'PATIENT_NUMBER': 'Patientennummer',
        'TIMESTAMP': 'Zeitpunkt',
        'CHOOSE_PATIENT': 'Patient auswählen',

        // settings
        'SAVE_SETTINGS': 'Einstellungen speichern',
        'IDENTITY': 'Identität',
        'DEVICE_SETTINGS': 'Geräte Einstellungen',
        'LANGUAGE': 'Sprache',
        'CHOOSE_IDENTITY': 'Identität auswählen',

        'SUCCESS': 'Erfolg',
        'YOUR_SETTINGS_WERE_SUCCESSFULLY_SAVED_TO_THE_DEVICE': 'Ihre Einstellungen wurden erfolgreich auf das Gerät gespeichert',

        // registration card
        'REGISTRATION_CARD_FOR_VOLUNTEERS': 'Meldekarte für Einsatzkräfte',
        'NAME': 'Name',
        'FIRST_NAME': 'Vorname',
        'DATE_OF_BIRTH': 'Geburtsdatum',
        'GENDER': 'Geschlecht',
        'RELIGION': 'Religion',
        'RESIDENCE': 'Wohnort',
        'NATIONALITY': 'Nationalität',
        'STREET': 'Straße',
        'N_OF_IDENTITY_DISK': 'Nr. der Erk.-Marke',
        'DISTRICT_BRANCH': 'Kreisverband',
        'RED_CROSS_UNIT': 'Gemeinschaft',
        'PLACE_OF_ACTION': 'Einsatzort',
        'DISASTER_PREPAREDNESS_UNIT': 'Einsatzformation',
        'START_OF_ACTION': 'Einsatzbeginn (Datum, Zeit)',
        'END_OF_ACTION': 'Einsatzende (Datum, Zeit)',
        'RANK': 'Funktion',

        'WARNING': 'Achtung',
        'START_ACTION': 'Einsatz beginnen',
        'NO_REGISTRATION_CARD_FOUND': 'Es wurde keine Meldekarte gefunden, bitte füllen Sie zuerst eine Meldekarte aus.',

        // resources
        'OPERATIONAL_RESOURCE': 'Einsatzmittel',
	'ADD_OPERATIONAL_RESOURCE': 'Einsatzmittel hinzufügen',
	'SAVE_RESOURCE': 'Einsatzmittel speichern',
	'CALL_SIGN': 'Funkrufname',
	'RESOURCE_TYPE': 'Art des Einsatzmittels',
	'SEATS': 'Sitzplätze',
	'ADD_SEAT': 'Sitzplatz hinzufügen',
	'SEAT': 'Sitzplatz',
	'SELECT': '- Bitte auswählen -',

	// staging
        'REGISTRATION_CARD_FOR_VOLUNTEER': 'Meldekarte für Einsatzkraft',

	// locations
        'LOCATION': 'Standort',
	'ADD_LOCATION': 'Standort hinzufügen',
	'EDIT_LOCATION': 'Standort bearbeiten',

	// journal
	'ADD_ENTRY': 'Eintrag hinzufügen',
	'SHOW_ENTRY_FROM': 'Zeige Eintrag vom',
	'AT': 'um',
	'SERIAL_NUMBER': 'lfd. Nr.',
	'DATETIME': 'Zeitpunkt',
	'TRANSMISSION': 'Übermittlung',
	    'RADIO': 'Funk',
	    'PHONE': 'Telefon',
	    'FAX': 'Fax',
	    'MESSENGER': 'Melder',
	'SENDER': 'Von',
	'RECIPIENT': 'An',
	'EVENT': 'Meldung',
	'EVENT_LONG': 'Ereignis / Meldung / Maßnahme',
	'AUTHOR': 'Eingetragen von',

	// statistics
	'PATIENT_STATISTIC' : 'Patientenstatistik',
	'VOLUNTEER_STATISTIC' : 'Einsatzkräftestatistik',
	'SUM' : 'Gesamt',
	'STRENGTH' : 'Stärke',
	'PLATOON_LEADER': 'Zugführer',
	'GROUP_LEADER': 'Gruppenführer',
	'VOLUNTEER': 'Helfer',

        // nationalities
        // thanks to https://deutsch.lingolia.com/de/wortschatz/laender-nationalitaeten
        'AD': 'andorranisch',
        'AE': 'der Vereinigten Arabischen Emirate',
        'AF': 'afghanisch',
        'AI': 'anguillanisch',
        'AM': 'armenisch',
        'AO': 'angolanisch',
        'AQ': 'antarktisch',
        'AR': 'argentinisch',
        'AS': 'österreichisch',
        'AU': 'australisch',
        'AW': 'arubanisch',
        'BA': 'bangladeschisch',
        'BB': 'barbadisch',
        'BE': 'belgisch',
        'BH': 'bahrainisch',
        'BM': 'bermudisch',
        'BO': 'bolivianisch',
        'BR': 'brasilianisch',
        'BS': 'bahamaisch',
        'BT': 'bhutanisch',
        'BU': 'bulgarisch',
        'BY': 'weißrussisch',
        'BZ': 'belizisch',
        'CA': 'kanadisch',
        'CG': 'kongolesisch',
        'CH': 'chinesisch',
        'CH': 'schweizerisch',
        'CL': 'chilenisch',
        'CM': 'kambodschanisch',
        'CM': 'kamerunisch',
        'CO': 'kolumbianisch',
        'CR': 'tschechisch',
        'CR': 'costa-ricanisch',
        'CU': 'kubanisch',
        'CY': 'zyprisch',
        'DE': 'deutsch',
        'DK': 'dänisch',
        'DM': 'dominikanisch',
        'EC': 'ecuadorianisch',
        'EE': 'estnisch',
        'EG': 'ägyptisch',
        'ET': 'äthiopisch',
        'FI': 'finnisch',
        'FJ': 'fidschianisch',
        'FR': 'französisch',
        'GB': 'britisch',
        'GE': 'georgisch',
        'GH': 'ghanaisch',
        'GN': 'guineisch',
        'GR': 'griechisch',
        'GY': 'guyanisch',
        'HK': 'chinesisch',
        'HR': 'kroatisch',
        'HU': 'ungarisch',
        'ID': 'indonesisch',
        'IE': 'irisch',
        'IN': 'indisch',
        'IQ': 'irakisch',
        'IR': 'iranisch',
        'IS': 'israelisch',
        'IS': 'isländisch',
        'IT': 'italienisch',
        'JM': 'jamaikanisch',
        'JO': 'jordanisch',
        'JP': 'japanisch',
        'KE': 'kenianisch',
        'KO': 'koreanisch',
        'KW': 'kuwaitisch',
        'KZ': 'kasachisch',
        'LB': 'libanesisch',
        'LK': 'sri-lankisch',
        'LT': 'litauisch',
        'LU': 'luxemburgisch',
        'MA': 'marokkanisch',
        'MC': 'monegassisch',
        'ME': 'mexikanisch',
        'MM': 'myanmarisch',
        'MN': 'mongolisch',
        'MU': 'mauritisch',
        'MV': 'maledivisch',
        'MY': 'malaysisch',
        'NA': 'namibisch',
        'NG': 'nigerianisch',
        'NL': 'niederländisch',
        'NO': 'norwegisch',
        'NP': 'nepalesisch',
        'NZ': 'neuseeländisch',
        'OM': 'omanisch',
        'PA': 'panamaisch',
        'PE': 'peruanisch',
        'PH': 'philippinisch',
        'PK': 'pakistanisch',
        'PO': 'polnisch',
        'PT': 'portugiesisch',
        'PY': 'paraguayisch',
        'QA': 'katarisch',
        'RO': 'rumänisch',
        'RU': 'russisch',
        'SA': 'saudi-arabisch',
        'SC': 'seychellisch',
        'SE': 'schwedisch',
        'SG': 'singapurisch',
        'SK': 'slowakisch',
        'SN': 'senegalesisch',
        'SO': 'somalisch',
        'SP': 'spanisch',
        'TH': 'thailändisch',
        'TN': 'tunesisch',
        'TR': 'türkisch',
        'TW': 'taiwanesisch',
        'TZ': 'tansanisch',
        'UA': 'ukrainisch',
        'UG': 'ugandisch',
        'US': 'amerikanisch',
        'UY': 'uruguayisch',
        'UZ': 'usbekisch',
        'VE': 'venezolanisch',
        'VN': 'vietnamesisch',
        'YE': 'jemenitisch',
        'ZA': 'südafrikanisch',
        'ZM': 'sambisch',
        'ZW': 'simbabwisch'
    });

    $translateProvider.preferredLanguage('en');
    $translateProvider.useSanitizeValueStrategy('escape');
});

app.run(function($rootScope, $localStorage, $location, $route, $translate) {
    // register listener to watch route changes
    $rootScope.$on('$routeChangeStart', function(event, next, current) {
	if (!$localStorage.volunteerId && next.templateUrl !== 'settings.html') {
	    $location.path('/settings');
	    $route.reload();
	}
    });
});
//}}}

app.factory('couchdb', function($http) {
    var couchdb = {};

    couchdb.getUUID = function(callback) {
        $http.get('/_uuids').success(function(data) {
            callback(data.uuids[0]);
        });
    };

    couchdb.createVolunteer = function(callback, initial) {
        if (initial === true) {
            $http.put('/disaster-app/feedc0de00000000000000000badc0de', {
                name: 'Example',
                firstName: 'Admin',
                dateOfBirth: '01.01.1970',
                nationality: 'US',
                residence: 'Anytown',
                street: 'Anystreet. 3',
                districtBranch: 'Anytown',
                redCrossUnit: 'Civil Protection',
                type: 'volunteer',
                gender: {
                    male: false,
                    female: false
                }
            }).then(callback, function () {
                // ignore any error if that volunteer already exists
            });
        } else {
            couchdb.getUUID(function(uuid) {
                $http.put('/disaster-app/' + uuid, {
                    name: 'Doe',
                    firstName: 'Jane',
                    dateOfBirth: '01.01.1970',
                    nationality: 'US',
                    residence: 'Anytown',
                    street: 'Anystreet. 3',
                    districtBranch: 'Anytown',
                    redCrossUnit: 'Civil Protection',
                    type: 'volunteer',
                    gender: {
                        male: false,
                        female: false
                    }
                }).success(callback);
            });
        }
    };

    return couchdb;
});

app.controller('ResourcesController', function($scope, dataProvider) {
    $scope.resources = dataProvider.getResources(true);
});

app.controller('ResourceController', function($scope, $rootScope, $routeParams, $http, $location, dataProvider, couchdb) {
    $scope.registry = [];
    if ($routeParams.id && $routeParams.id != -1) {
        $http.get('/disaster-app/' + $routeParams.id).success(function(res) {
            $scope.resource = res;
        });
    } else {
	$scope.resource = {
	    name: '',
	    notes: '',
	    callSign: '',
	    resourceType: '',
	    type: 'resource',
	};
        couchdb.getUUID(function(uuid) {
	    $scope.resource._id = uuid;
	});
    }

    $scope.save = function() {
	var resource = angular.copy($scope.resource);

        $http.put('/disaster-app/' + $scope.resource._id, resource).success(function(res) {
            $location.path('/admin/resources');
        }).error(function(data, status) {
            // TODO handle 409 conflict
            alert(data + ' ' + status);
        });
    };

    $scope.ovolunteers = dataProvider.getVolunteers();
    $scope.volunteers = [];

    $scope.$watch('ovolunteers', function() {
	$scope.volunteers = Object.keys($scope.ovolunteers).map(function(k) {
	    return $scope.ovolunteers[k];
	});
    }, true);
});

app.controller('JournalController', function($rootScope, $scope, $http, $timeout, $localStorage, dataProvider, couchdb) {
    $scope.journal = dataProvider.getJournal(true);
    $scope.volunteers = dataProvider.getVolunteers();
    $scope.transmissions = dataProvider.getTransmissions();
    $scope.recipients = [ ' <manuelle Eingabe>' ];

    $scope.input = {text: '', model: '', oldVal: ''};

    $scope.$watch('journal', function() {
	$scope.journal.forEach(function(entry) {
	    if ($scope.recipients.indexOf(entry.recipient) < 0)
		$scope.recipients.push(entry.recipient);

	    if ($scope.recipients.indexOf(entry.sender) < 0)
		$scope.recipients.push(entry.sender);
	});
    }, true);

    $scope.mcb = function(done) {
	$timeout(function() {
	    if (!done) {
		$scope.entry[$scope.input.model] = $scope.input.oldVal;
		return;
	    }
	    $scope.recipients.push($scope.input.text);
	    $scope.entry[$scope.input.model] = $scope.input.text;
	});
    };

    var checkRecipient = function(model) {
	return function(newVal, oldVal) {
	    if (newVal === $scope.recipients[0]) {
		$scope.input.text = '';
		$scope.input.model = model;
		$scope.input.oldVal = oldVal;
		$rootScope.Ui.turnOn('manual');
	    }
	};
    };

    $scope.$watch('entry.sender', checkRecipient('sender'));
    $scope.$watch('entry.recipient', checkRecipient('recipient'));

    $scope.addEntry = function() {
	couchdb.getUUID(function(uuid) {
	    $scope.entry = {
		_id: uuid,
		type: 'journal',
		datetime: new Date(),
		identityId: $localStorage.volunteerId,
		transmission: '',
		sender: '',
		recipient: '',
		event: '',
	    };
	    $rootScope.Ui.turnOn('entryAdd');
	});
    };

    $scope.showEntry = function(entry) {
	$scope.entry = entry;
	$rootScope.Ui.turnOn('entryShow');
    };

    $scope.saveEntry = function() {
        $rootScope.loading = true;
        $http.put('/disaster-app/' + $scope.entry._id, $scope.entry).success(function(res) {
	    $rootScope.loading = false;
        }).error(function(data, status) {
	    // should not happen
        });
    };
});

app.controller('VolunteersController', function($rootScope, $scope, $http, $location, dataProvider, couchdb) {
    $scope.volunteers = dataProvider.getVolunteers(true);

    $scope.add = function() {
	$rootScope.loading = true;

        couchdb.createVolunteer(function(res) {
            $rootScope.loading = false;
            $location.path('/admin/volunteer/' + uuid);
        });
    };
});

app.controller('VolunteerController', function($rootScope, $scope, $http, $routeParams, dataProvider, couchdb) {
    $scope.ranks = dataProvider.getRanks();
    $scope.resources = dataProvider.getResources();
    $scope.locations = dataProvider.getLocations();
    $scope.nationalities = dataProvider.getNationalities();

    var reference = null;
    if ($routeParams.id && $routeParams.id != -1) {
	$http.get('/disaster-app/' + $routeParams.id).success(function(volunteer) {
	    if (volunteer.type !== 'volunteer')
		return;

	    $scope.volunteer = angular.copy(volunteer);
	    reference = volunteer;
	});
    } else {
	// TODO new volunteer?
	$scope.volunteer = { };
    }

    $scope.save = function() {
	$rootScope.loading = true;
	var diff = DeepDiff.diff(reference, $scope.volunteer);

	if (diff) {
	    $http.put('/disaster-app/' + $scope.volunteer._id, $scope.volunteer).success(function(res) {
		$scope.volunteer._rev = res.rev;
		reference = angular.copy($scope.volunteer);
		$rootScope.loading = false;
	    }).error(function(data, status) {
		// TODO handle conflict
	    });
	}
    };
});

app.controller('NotepadController', function($scope, $http, $localStorage, couchdb) {
    $scope.doc = {};
    $scope.input = {text: ''};
    $scope.todos = [];

    var merge = function(cb) {
	$http.get('/disaster-app/_design/disasterApp/_view/notepad?key="' + $localStorage.volunteerId + '"').success(function(res) {
	    if (res.rows.length == 0) {
		couchdb.getUUID(function(uuid) {
		    $scope.doc._id = uuid;
		});
	    } else {
		$scope.doc._id = res.rows[0].value._id;
		$scope.doc._rev = res.rows[0].value._rev;

		// merge with existing todos
		var todos = $scope.todos.map(function(todo) { return todo.text; });
		res.rows[0].value.todos.forEach(function(todo) {
		    if (todos.indexOf(todo.text) == -1)
			$scope.todos.push(todo)
		});

		if (angular.isFunction(cb))
		    cb();
	    };
	});
    };
    merge();

    $scope.saveNotepad = function() {
        $http.put('/disaster-app/' + $scope.doc._id, angular.extend({
	    ownerId: $localStorage.volunteerId,
	    type: 'notepad',
	    todos: $scope.todos
	}, $scope.doc)).success(function(res) {
            $scope.doc._rev = res.rev;
        }).error(function(data, status) {
	    // if 409 conflict, then retreive, merge and save again
	    if (status == 409)
		merge(saveNotepad);
	    else
		alert(data + ' ' + status);
        });
    };

    $scope.addTodo = function() {
	if (!$scope.input.text)
	    return;

	$scope.todos.push({
	    text: $scope.input.text,
	    done:false
	});

	$scope.input.text = '';
	$scope.saveNotepad();
    };

    $scope.remaining = function() {
	return $scope.todos.reduce(function(count, todo) {
	    return count + (todo.done ? 0 : 1);
	}, 0);
    };
});

app.controller('PatientsController', function($scope, dataProvider) {
    $scope.patients = dataProvider.getPatients(true);
    $scope.patientRegistry = dataProvider.getPatientRegistry();
    $scope.locations = dataProvider.getLocations();
});

app.directive('leafletResize', function($window, $timeout) {
    return {
	restrict: 'A',
	link: function(scope, element, attrs) {
	    var getElementOffset = function(element) {
		var de = document.documentElement;
		var box = element.getBoundingClientRect();
		var top = box.top + window.pageYOffset - de.clientTop;
		var left = box.left + window.pageXOffset - de.clientLeft;
		return { top: top, left: left };
	    }
	    var resize = function(e) {
		element[0].style.height = ($window.innerHeight - getElementOffset(element[0]).top - 95) + 'px';

		if (angular.isFunction(scope.resizeCallback))
		    scope.resizeCallback();
	    };

	    element.on('resize', resize);
	    angular.element($window).on('resize', resize);

	    $timeout(function() {
		resize();
	    });
	}
    }
});

app.controller('StatisticsController', function($scope, dataProvider) {
    $scope.sorting = { text: '' };
    $scope.sortings = dataProvider.getSortings();
    $scope.opatients = dataProvider.getPatients();

    $scope.patients = [];
    $scope.counts = {};
    $scope.sum = 0;

    $scope.$watch('opatients', function() {
	$scope.sortings.forEach(function(sorting) {
	    $scope.counts[sorting.text] = 0;
	});

	$scope.sum = 0;

	$scope.patients = Object.keys($scope.opatients).map(function(k) {
	    $scope.counts[$scope.opatients[k].sorting.text]++;
	    $scope.sum++;
	    return $scope.opatients[k];
	});
    }, true);

    $scope.ranks = dataProvider.getRanks();
    $scope.rank = { text: '' };

    $scope.ovolunteers = dataProvider.getVolunteers();

    $scope.strength = '- / - / -';
    $scope.volunteers = [];
    $scope.volunteerSum = 0;
    $scope.volunteerCounts = {};

    $scope.$watch('opatients', function() {
	$scope.ranks.forEach(function(rank) {
	    $scope.volunteerCounts[rank.text] = 0;
	});

	$scope.volunteerSum = 0;

	$scope.volunteers = Object.keys($scope.ovolunteers).map(function(k) {
	    if ($scope.ovolunteers[k].rank)
		$scope.volunteerCounts[$scope.ovolunteers[k].rank]++;
	    else
		$scope.volunteerCounts[$scope.ranks[$scope.ranks.length - 1].text]++;

	    $scope.volunteerSum++;
	    return $scope.ovolunteers[k];
	});

	$scope.strength = '';
	$scope.ranks.forEach(function(rank) {
	    if ($scope.volunteerCounts[rank.text] > 0)
		$scope.strength+= $scope.volunteerCounts[rank.text] + ' / ';
	    else
		$scope.strength+= '- / ';
	});

    }, true);
});

app.controller('LocationController', function($rootScope, $window, $scope, $http, $timeout, dataProvider, couchdb, leafletBoundsHelpers, leafletData) {
    $scope.locations = dataProvider.getLocations();
    $scope.vlocation = { _id : null };
    $scope.location = null;

    $scope.sortings = dataProvider.getSortings();
    $scope.patients = dataProvider.getPatients();
    $scope.registry = dataProvider.getLocations(true);
    $scope.volunteers = dataProvider.getVolunteers(true);
    $scope.patientRegistry = dataProvider.getPatientRegistry();

    $scope.patientCounts = {};
    $scope.$watch('patientRegistry', function(registry) {
	Object.keys($scope.patientCounts).forEach(function(key) {
	    $scope.patientCounts[key].length = 0;
	});
	Object.keys(registry).forEach(function(key) {
	    if (!registry[key].sorting || !registry[key].locationId)
		return;

	    if (!$scope.patientCounts[registry[key].locationId])
		$scope.patientCounts[registry[key].locationId] = [];

	    $scope.patientCounts[registry[key].locationId].push(registry[key]);
	});
    }, true);

    $scope.$watch('locations', function(locations) {
	Object.keys(locations).forEach(function(key) {
	    if (!$scope.patientCounts[locations[key]._id])
		$scope.patientCounts[locations[key]._id] = [];
	});
    }, true);


    // set max bounds to the test area
    $scope.maxbounds = {
	southWest: { lat: 48.417265, lng: 9.936400 },
	northEast: { lat: 48.427689, lng: 9.966895 }
    };

    // set defaults for the map
    $scope.defaults = {
	minZoom: 16,
	maxZoom: 18,
	attributionControl: false,
        // tiles can also be pushed to couchdb, to allow an offline usage of the map
        // tileLayer: 'img/tiles/{z}/{x}/{y}.png',
    };

    $scope.windowHeight = ($window.innerHeight / 2) + 'px';
    $scope.resizeCallback = function() {
	leafletData.getMap().then(function(map) {
	    map.invalidateSize();
	});
    };

    $scope.events = {};
    $scope.markers = [];
    $scope.$on('leafletDirectiveMap.click', function(event, args) {
	var leafEvent = args.leafletEvent;

	var marker = {
	    lat: leafEvent.latlng.lat,
	    lng: leafEvent.latlng.lng
	};

	$scope.location.lat = marker.lat;
	$scope.location.lng = marker.lng;

	if ($scope.markers.length < 1)
	    $scope.markers.push(marker);
	else 
	    $scope.markers[0] = marker;
    });

    $scope.addLocation = function() {
        $scope.title = 'ADD_LOCATION';

	couchdb.getUUID(function(uuid) {
	    $scope.location = {
		_id: uuid,
		lat: '',
		lng: '',
		type: 'location',
		name: '',
		notes: ''
	    };
	    $scope.markers = [];

	    leafletData.getMap().then(function(map) {
		map.locate({ setView: true });
	    });

	    $rootScope.Ui.turnOn('modal');
	});
    };

    $scope.editLocation = function(location) {
        $rootScope.Ui.turnOn('modal');
        $scope.location = location;
	$scope.markers = [{
	    lat: location.lat,
	    lng: location.lng
	}];

	leafletData.getMap().then(function(map) {
	    setTimeout(function() {
		if (location.lat && location.lng)
		    map.setView($scope.markers[0], 18);
		else
		    map.locate({ setView: true });
	    }, 100);
	})

        $scope.title = 'EDIT_LOCATION';
    };

    $scope.saveLocation = function() {
        $rootScope.loading = true;
        $http.put('/disaster-app/' + $scope.location._id, $scope.location).success(function(res) {
            $scope.location._rev = res.rev;

            if (!$scope.locations[res.id])
                $scope.locations[res.id] = $scope.location;

            $rootScope.Ui.turnOff('modal');
            $rootScope.loading = false;
        }).error(function(data, status) {
            // TODO handle 409 conflict
            alert(data + ' ' + status);
        });
    };
});

app.controller('RegistryController', function($rootScope, $scope, $localStorage, $http, $route, $interval, dataProvider, couchdb) {
    $scope.registry = { timestamp: 0 };

    $interval(function() {
        $scope.registry.timestamp = Date.now();
    }, 1000);

    $scope.patients = dataProvider.getPatients(true);
    $scope.locations = dataProvider.getLocations();

    $scope.sign = function() {
        $rootScope.loading = true;
        couchdb.getUUID(function(uuid) {
            var registry = {
		type: 'registry',
                notes: $scope.registry.notes,
                timestamp: $scope.registry.timestamp,
                patientId: $scope.registry.patient._id,
                locationId: $scope.registry.locationId,
		volunteerId: $localStorage.volunteerId
            };

            $http.put('/disaster-app/' + uuid, registry).success(function(res) {
                $rootScope.loading = false;
		$scope.registry.notes = '';
		$scope.registry.patient = null;
            });
        });
    };
});

app.controller('PatientController', function($rootScope, $scope, $routeParams, $localStorage, $http, $location, dataProvider, couchdb) {
    var oldSorting = {};
    $scope.patient = {
	diagnoses: []
    };
    $scope.isExistingPatient = false;
    $scope.registry = [];

    $scope.volunteers = dataProvider.getVolunteers();
    $scope.locations = dataProvider.getLocations();

    if ($routeParams.id && $routeParams.id != -1) {
        $http.get('/disaster-app/' + $routeParams.id).success(function(res) {
            $scope.isExistingPatient = true;

	    if (Date.parse(res.dateOfBirth))
		res.dateOfBirth = new Date(res.dateOfBirth);
	    else
		res.dateOfBirth = '';

	    if (Date.parse(res.datetime))
		res.datetime = new Date(res.datetime);
	    else
		res.datetime = '';

            $scope.patient = res;
            oldSorting = angular.copy($scope.patient.sorting);
        });

	$http.get('/disaster-app/_design/disasterApp/_view/registry?key="' + $routeParams.id + '"').success(function(res) {
            res.rows.forEach(function(row) {
                $scope.registry.push({
                    id: row.id,
                    location: row.value.locationId,
                    timestamp: row.value.timestamp,
                    volunteerId: row.value.volunteerId,
                    notes: row.value.notes
                });
            });
        });
    } else {
        $scope.patient = {
	    patientNumber: '',
	    firstName: '',
	    name: '',
	    dateOfBirth: '',
	    gender: {
		male: false,
		female: false
	    },
	    residence: '',
	    nationality: '',
	    street: '',
	    remarks: '',
	    placeOfFinding: '',
	    datetime: '',
	    transportation: '',
	    destination: '',
	    transportationOptions: [],
	    whereabouts: '',
            sortingLog: [],
	    diagnoses: [],
	    type: 'patient',
            sorting: {
                class: 'btn-default',
                text: 'NOT_SORTED_YET'
            },
	    consciousness: '',
	    respiration: '',
	    circulation: '',
	    pain: '',
        };
        couchdb.getUUID(function(uuid) {
	    $scope.patient._id = uuid;
	});
    }

    $scope.sortings = dataProvider.getSortings();
    $scope.transportations = dataProvider.getTransportations();
    $scope.nationalities = dataProvider.getNationalities();
    $scope.consciousness = dataProvider.getConsciousness();
    $scope.respiration = dataProvider.getRespiration();
    $scope.circulation = dataProvider.getCirculation();
    $scope.diagnoses = dataProvider.getDiagnoses();
    $scope.pain = dataProvider.getPain();

    $scope.cDiagnose = {
	index: -1,
	diagnose: false
    };

    $scope.editDiagnose = function() {
	$rootScope.Ui.turnOn('diagnoseType');
    };

    $scope.showDiagnose = function(d) {
	$scope.cDiagnose.index = $scope.patient.diagnoses.indexOf(d);
	$scope.cDiagnose.diagnose = angular.copy(d);

	$rootScope.Ui.turnOn('diagnoseShow');
    };

    $scope.addDiagnose = function(evt) {
	$scope.cDiagnose.index = -1;
	$scope.cDiagnose.diagnose = {
	    style: {
		position: 'absolute',
		left: (evt.offsetX - 17) + 'px',
		top: evt.offsetY + 'px'
	    },
	    target: {
		top: evt.offsetY / evt.target.height,
		left: evt.offsetX / evt.target.width,
	    },
	    diagnose: {
		icon: '',
		text: '',
		class: ''
	    },
	    text: ''
	};

	$rootScope.Ui.turnOn('diagnoseType');
    };

    $scope.setDiagnoseType = function(diagnose) {
	$scope.cDiagnose.diagnose.diagnose = diagnose;
	$rootScope.Ui.turnOn('diagnoseText');
    };

    $scope.saveDiagnose = function() {
	if ($scope.cDiagnose.index > -1)
	    $scope.patient.diagnoses[$scope.cDiagnose.index] = $scope.cDiagnose.diagnose;
	else
	    $scope.patient.diagnoses.push($scope.cDiagnose.diagnose);

	$scope.cDiagnose.index = -1;
	$scope.cDiagnose.diagnose = false;
    };

    $scope.cancelDiagnose = function() {
	$scope.cDiagnose.index = -1;
	$scope.cDiagnose.diagnose = false;
    };

    $scope.deleteDiagnose = function() {
	if ($scope.cDiagnose.index > -1)
	     $scope.patient.diagnoses.splice($scope.cDiagnose.index, 1);
    };

    $scope.save = function() {
        if (oldSorting.class != $scope.patient.sorting.class) {
            $scope.patient.sortingLog.push({
                timestamp: Date.now(),
                text: $scope.patient.sorting.text,
                class: $scope.patient.sorting.class,
		volunteerId: $localStorage.volunteerId,
            });
        }
        $http.put('/disaster-app/' + $scope.patient._id, $scope.patient).success(function(res) {
            $location.path('/patients');
        }).error(function(data, status) {
            // TODO handle 409 conflict
            alert(data + ' ' + status);
        });
    };
});

app.controller('RegistrationCardController', function($scope, $http, $localStorage, couchdb) {
    $scope.showWarning = true;
    $scope.card = {};

    if ($localStorage.volunteerId) {
	$scope.showWarning = false;
	$http.get('/disaster-app/' + $localStorage.volunteerId).success(function(volunteer) {
	    if (volunteer.type === 'volunteer')
		$scope.card = volunteer;
	});
    }

    $scope.save = function() {
        if (!$localStorage.volunteerId) {
            couchdb.getUUID(function(uuid) {
                $localStorage.volunteerId = uuid;
		$scope.card.startOfAction = new Date();
                $scope.save();
            });
            return;
        }

	// FIXME volunteer has no card anymore
        $http.put('/disaster-app/' + $localStorage.volunteerId, {
	    type: 'volunteer',
	    card: $scope.card
	}).success(function(res) {
	    $scope.card._id = res.id;
	    $scope.card._rev = res.rev;
	});
    };
});

app.controller('SettingsController', function($rootScope, $scope, $timeout, $localStorage, $translate, dataProvider, couchdb) {
    $scope.languages = {
        'de': 'Deutsch',
        'en': 'English'
    };

    $scope.$watch('settings', function(newValue, oldValue) {
	if (oldValue.admin != newValue.admin) {
	    if (newValue.admin) {
		if (prompt("Enter PIN") == '1348')
		    $localStorage.admin = newValue.admin;
		else
		    $scope.settings.admin = false;
	    } else {
		$localStorage.admin = newValue.admin;
	    }
	}

	if (oldValue.language != newValue.language) {
	    $localStorage.language = newValue.language;
	    $translate.use($localStorage.language);
	}
    }, true);

    $scope.settings = {
	admin: $localStorage.admin ? $localStorage.admin : false,
	language: $localStorage.language ? $localStorage.language : 'en'
    };

    $scope.identity = null;
    $scope.volunteers = dataProvider.getVolunteers(true);

    $scope.$watch('volunteers', function(newValue, oldValue) {
        console.log(newValue);
        if ($scope.volunteers.length < 1) {
            couchdb.createVolunteer(function(res) {
                // the new volunteer will automatically be shown in the selection menu
            }, true);
        }

	$scope.volunteers.forEach(function(row) {
	    if (row._id == $localStorage.volunteerId)
		$scope.identity = row;
	});
    }, true);

    $scope.changeIdentity = function(identity) {
	$localStorage.volunteerId = identity._id;
	$localStorage.firstName = identity.firstName;
	$localStorage.name = identity.name;
	$scope.identity = identity;
    };

    // automatically open identity chooser, if no identity is selected
    $timeout(function() {
	if (!$localStorage.volunteerId) 
	    $rootScope.Ui.turnOn('identity');
    });
});

app.controller('MainController', function($rootScope, $route, $scope, $http, $timeout, $localStorage, $translate, dataProvider, couchdb) {
    // Needed for the loading screen
    $rootScope.$on('$routeChangeStart', function() { $rootScope.loading = true; });
    $rootScope.$on('$routeChangeSuccess', function() { $rootScope.loading = false; });

    $scope.$storage = $localStorage;
    $scope.$storage.admin = $localStorage.admin ? $localStorage.admin : false;
    $scope.$storage.unreadMessages = $localStorage.unreadMessages ? $localStorage.unreadMessages : 0;
    $translate.use($localStorage.language ? $localStorage.language : 'en');

    $scope.input = { message : '' };
    $scope.messages = [];
    $scope.lastSeq = 0;
    $scope.info = {};

    $scope.toast = false;
    var showToast = function(sender, message) {
	$scope.toast = {
	    sender: sender,
	    message: message,
	};
	$timeout(function() {
	    $scope.toast = false;
	}, 4000);
    };

    $scope.volunteers = dataProvider.getVolunteers();

    $scope.submit = function() {
        if ($scope.input.message) {
            couchdb.getUUID(function(uuid) {
                $http.put('/disaster-app/' + uuid, {
		    _id: uuid,
		    type: 'message',
                    sender: $localStorage.volunteerId,
                    message: $scope.input.message,
                    datetime: new Date()
                }).success(function(res) {
                    $scope.input.message = '';
                });
            });
        }
    };

    $scope.getClass = function(msg) {
	// check if message is from myself
	if (msg.sender == $localStorage.volunteerId)
	    return 'bg-warning';

	// check if my identity is mentioned in the message
	if (msg.message.indexOf('@' + $localStorage.name) >= 0 || msg.message.indexOf('@' + $localStorage.firstName) >= 0)
	    return 'bg-info';

	return '';
    };

    $scope.bottomReached = function() {
	// mark all messages as read
	$scope.$storage.unreadMessages = 0;
    };

    $scope.getMessages = function() {
	$http.get('/disaster-app/_changes?feed=longpoll&include_docs=true&filter=disasterApp/messages&since=' + $scope.lastSeq).success(function(res) {
	    res.results.forEach(function(msg) {
		// increase number of unread messages, if message is not from myself
		if (msg.doc.sender != $localStorage.volunteerId && res.last_seq > $localStorage.lastSeq)
		    $scope.$storage.unreadMessages++;

		$scope.messages.push(msg.doc);
	    });

	    // show a notification, when this is not the initial load and
	    // the user is not currently viewing messages
	    if ($scope.$storage.unreadMessages > 0 && $scope.lastSeq > 0 && $route.current.loadedTemplateUrl != 'templates/messages.html')
		showToast($scope.volunteers[$scope.messages[$scope.messages.length-1].sender].firstName
		    + ' ' + $scope.volunteers[$scope.messages[$scope.messages.length-1].sender].name,
		    $scope.messages[$scope.messages.length-1].message
		);

	    // repeat the request with new last_seq
	    $localStorage.lastSeq = res.last_seq;
	    $scope.lastSeq = res.last_seq;
	    $scope.getMessages();
	}).error(function() {
	    // if request fails, repeat the request
	    $scope.getMessages();
	});
    };
    $scope.getMessages();
});
