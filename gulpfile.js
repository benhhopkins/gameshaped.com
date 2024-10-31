const gulp = require('gulp');
const markdown = require('markdown-it')({
    html: true
});
const markdownattrs = require('markdown-it-attrs')
const rename = require('gulp-rename');
const fs = require('fs');
const map = require('map-stream');
const sass = require('gulp-sass')(require('sass'));
const connect = require('gulp-connect');

markdown.use(markdownattrs);

var paths = {
    styles: {
        src: 'css/*.scss',
        dest: 'css'
    },
    pages: {
        src: './pages/*/*.md',
        dest: './pages'
    }
};

function compile() {
    var currentPath = '';

    return gulp.src(paths.pages.src, {since: gulp.lastRun(compile)})
    .pipe(map(function (file, cb) {
        var md = file.contents.toString();
        var html = markdown.render(md);
        file.contents = Buffer.from(html);
        cb(null, file);
    }))
    .pipe(rename(function(path) {
        path.basename = "markdown";
        path.extname = ".html";
        return path;
    }))
    .pipe(gulp.dest('./pages'))
    .pipe(rename(function (path) {
        currentPath = path.dirname;
        path.basename = "index";
        console.log(currentPath);
        return path;
    }))
    .pipe(map(function (file, cb) {
        var fileContents = file.contents.toString();
        var template = fs.readFileSync("pages/template.html", "utf8");

        var header = fs.readFileSync("pages/header.html", "utf8");
        var footer = fs.readFileSync("pages/footer.html", "utf8");

        template = template.replace("<%article%>", fileContents);
        template = template.replace("<%header%>", header);
        template = template.replace("<%footer%>", footer);

        if (fs.existsSync("pages/" + currentPath + "/title")) {
            var pagelang = fs.readFileSync("pages/" + currentPath + "/title", "utf8");
            template = template.replace("<%title%>", pagelang);
        }
        else {
            template = template.replace("<%title%>", "Gameshaped Software");
        }

        if (fs.existsSync("pages/" + currentPath + "/pagelang")) {
            var pagelang = fs.readFileSync("pages/" + currentPath + "/pagelang", "utf8");
            template = template.replace("<%pagelang%>", pagelang);
        }
        else {
            template = template.replace("<%pagelang%>", "");
        }

        if (fs.existsSync("pages/" + currentPath + "/pagescripts")) {
            var pagescripts = fs.readFileSync("pages/" + currentPath + "/pagescripts", "utf8");
            template = template.replace("<%pagescripts%>", pagescripts);
        }
        else {
            template = template.replace("<%pagescripts%>", "");
        }
        
        file.contents = Buffer.from(template);
        cb(null, file);
    }))
    .pipe(gulp.dest(paths.pages.dest))
    .pipe(connect.reload());
}

function styles() {
    return gulp.src(paths.styles.src)
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest(paths.styles.dest))
        .pipe(connect.reload());
}

function server() {
    connect.server({
        root: './',
        port: 8080,
        livereload: true
    });
}

function watch() {
    gulp.watch(paths.pages.src, gulp.series(compile));
    gulp.watch(paths.styles.src, gulp.series(styles));
}

var build = gulp.parallel(watch, gulp.series(compile, styles, server));

exports.styles = styles;
exports.compile = compile;
exports.server = server;
exports.watch = watch;
exports.build = build;
exports.default = build;