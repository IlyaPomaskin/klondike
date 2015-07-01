var gulp = require('gulp');
var source = require('vinyl-source-stream');
var concat = require('gulp-concat');
var browserify = require('browserify');
var babelify = require('babelify');

gulp.task('build', function () {
    browserify({
        entries: 'src/main.js',
        extensions: ['.js', '.jsx'],
        debug: true
    })
        .transform(babelify)
        .bundle()
        .pipe(source('main.js'))
        .pipe(gulp.dest('dist'))
        .on('error', function (err) {
            console.log(err.toString());
            this.emit('end')
        });
});

gulp.task('html', function () {
    gulp
        .src(['src/index.html', 'package.json'])
        .pipe(gulp.dest('dist'))
});

gulp.task('css', function () {
    gulp
        .src('src/styles.css')
        .pipe(concat('styles.css'))
        .pipe(gulp.dest('dist'));
});
gulp.task('dist', ['html', 'css', 'build']);

gulp.task('watch', function () {
    gulp.watch(['src/**/*'], ['dist']);
});

gulp.task('watch-task', function () {
    gulp.watch(['src/**/*'], [process.argv.pop()]);
});

gulp.task('default', ['dist']);
