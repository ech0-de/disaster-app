const gulp = require('gulp');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const cleanCSS = require('gulp-clean-css');

gulp.task('dist-css', () => {
  return gulp.src([
    'node_modules/font-awesome/css/font-awesome.css',
    'node_modules/mobile-angular-ui/dist/css/mobile-angular-ui-hover.css',
    'node_modules/mobile-angular-ui/dist/css/mobile-angular-ui-base.css',
    'node_modules/mobile-angular-ui/dist/css/mobile-angular-ui-desktop.css',
    'node_modules/leaflet/dist/leaflet.css'
  ])
    .pipe(cleanCSS())
    .pipe(concat('dist.css'))
    .pipe(gulp.dest('_attachments/css'));
});

gulp.task('dist-js', () => {
  return gulp.src([
    'node_modules/angular/angular.js',
    'node_modules/angular-i18n/angular-locale_de-de.js',
    'node_modules/angular-route/angular-route.js',
    'node_modules/mobile-angular-ui/dist/js/mobile-angular-ui.js',
    'node_modules/mobile-angular-ui/dist/js/mobile-angular-ui.gestures.js',
    'node_modules/angular-translate/dist/angular-translate.js',
    'node_modules/ngstorage/ngStorage.js',

    'node_modules/leaflet/dist/leaflet.js',
    'node_modules/angular-simple-logger/dist/angular-simple-logger.js',
    'node_modules/angular-leaflet-directive/dist/angular-leaflet-directive.js',

    'node_modules/angularjs-scroll-glue/src/scrollglue.js',
    'node_modules/deep-diff/index.js'
  ])
    .pipe(uglify())
    .pipe(concat('dist.js'))
    .pipe(gulp.dest('_attachments/js'));
});

gulp.task('dist-fonts', () => {
  return gulp.src([
    'node_modules/font-awesome/fonts/*'
  ])
    .pipe(gulp.dest('_attachments/fonts'));
});

gulp.task('dist', ['dist-css', 'dist-js', 'dist-fonts']);

gulp.task('default', ['dist']);
