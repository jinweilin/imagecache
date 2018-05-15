const http = require('http'),
  https = require('https'),
  url = require('url'),
  gm = require('gm'),
  md5 = require('md5'),
  mkdirp = require('mkdirp'),
  fs = require('fs'),
  request = require('request'),
  moment = require('moment'),
  etag = require('etag');

module.exports = function (basePath) {
  return http.createServer(function (req, res) {
    // parseurl
    /* url formate 
      /width/original_image_urlpaht 
      /widthxheight/original_image_urlpaht
      /xheight/original_image_urlpaht
    */
    let imageStream, params = parseParams(req.url);
    const parsedBasePath = url.parse(params.imagePath);
    console.log("parsedBasePath.hostname:" , parsedBasePath.hostname);
    console.log("parsedBasePath.path:", parsedBasePath.path);
    //no host and favicon.ico both don't support
    if (null == parsedBasePath.hostname || typeof parsedBasePath.hostname == 'undefined' || parsedBasePath.path == 'favicon.ico') {
      res.writeHead(400, {
        'Content-type': 'text/html'
      })
      res.end("No such image");
      return ;
    }
    const orgMd5 = '/tmp/' + moment().format('YYYYMMDDHH') + "/" + md5(parsedBasePath.path);
    const targetMd5 = '/tmp/' + moment().format('YYYYMMDDHH') + "/target/" + md5(req.url);
    const targetFolder = '/tmp/' + moment().format('YYYYMMDDHH') + "/target";
    const options = {
      host: parsedBasePath.hostname,
      port: parsedBasePath.port,
      path: parsedBasePath.path
    };
    // have been in tmp folder
    if (fs.existsSync(targetMd5)) {
      console.log("Hit Cache same size:", parsedBasePath.path);
      fs.readFile(targetMd5, function (err, content) {
        if (err) {
          res.writeHead(400, {
            'Content-type': 'text/html'
          })
          console.log(err);
          res.end("No such image");
        } else {
          const stats = fs.statSync(targetMd5);
          //specify the content type in the response will be an image
          res.writeHead(200, {
            'Content-type': 'image/jpeg',
            'Cache-Control': "max-age=604800",
            'X-Photo-Cache': 'HIT',
            'Last-Modified': stats.mtime,
            'ETag': etag(stats)
          });
          res.end(content);
        }
      });
    } else {
      //resize
      const resizeImage = function (orgMd5, targetMd5, params, photoCache, res) {
        if (!params.size) { //no assign widht and hight
          gm(orgMd5).unsharp(1).quality(30).noProfile().compress('JPEG').write(targetMd5, function (err) {
            if (!err) return showimage(res, photoCache);
            else return showerror(res);
          });
        } else if (!params.size.height) { //only assign width
          gm(orgMd5).resize(params.size.width).unsharp(1).quality(30).noProfile().compress('JPEG').write(targetMd5, function (err) {
            if (!err) return showimage(res, photoCache);
            else return showerror(res);
          });
        } else if (!params.size.width) { //only assign height
          gm(orgMd5).resize(null, params.size.height).unsharp(1).quality(30).noProfile().compress('JPEG').write(targetMd5, function (err) {
            if (!err) return showimage(res, photoCache);
            else return showerror(res);
          });
        } else { // Otherwise resize and crop the image , assign widht and height
          gm(orgMd5).resize(params.size.width, params.size.height, '^').gravity('Center').unsharp(1).quality(30).noProfile().compress('JPEG').crop(params.size.width, params.size.height).write(targetMd5, function (err) {
            if (!err) return showimage(res, photoCache);
            else return showerror(res);
          });
        }
      }
      //Display
      const showimage = function (res, photoCache) {
        fs.readFile(targetMd5, function (err, content) {
          if (err) {
            console.log(err);
            return showerror(res);
          } else {
            const stats = fs.statSync(targetMd5);
            res.writeHead(200, {
              'Content-type': 'image/jpeg',
              'Cache-Control': "max-age=604800",
              'Last-Modified': stats.mtime,
              'X-Photo-Cache': photoCache,
              'ETag': etag(stats)
            });
            //specify the content type in the response will be an image
            res.end(content);
          }
        });
        return;
      }
      //Showerror
      const showerror = function (res) {
        res.writeHead(400, {
          'Content-type': 'text/html'
        })
        res.write("access denied1");
        res.end();
        return;
      }
      //check the original image have been in tmp folder, we just need to resize no more download again.
      if (fs.existsSync(orgMd5)) {
        console.log("Hit Cache no same size:", parsedBasePath.path);
        // resize and show it.
        resizeImage(orgMd5, targetMd5, params, 'Half', res);
      } else {
        console.log("Not Hit Cache:", parsedBasePath.path);
        mkdirp(targetFolder, function (err) {
          if (err) {
            console.log("err:", err);
            showerror(res);
          } else {
            //Download original image to tmp folder
            download(parsedBasePath.protocol + "//" + parsedBasePath.hostname + parsedBasePath.path, orgMd5, function () {
              console.log("download file done");
              res.statusCode = imgres.statusCode
              if (imgres.statusCode !== 200) {
                imgres.pipe(res);
                return;
              } else {
                // resize and show it.
                return resizeImage(orgMd5, targetMd5, params, "No", res);
              }
            });
          }
        });
      }
    }
  })
}
let imgres;
const download = function (uri, filename, callback) {
  request.head(uri, function (err, res1, body) {
    imgres = res1;
    console.log('uri:', uri);
    console.log('content-type:', res1.headers['content-type']);
    console.log('content-length:', res1.headers['content-length']);
    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};
const widthRegex = /^\/(\d+)*\//, // /100/image_url
  widthHeightRegex = /^\/(\d+)x?(\d+)*\//, // /100x100/image_url
  heightRegex = /^\/x?(\d+)*\//; // /x100/image_url

function parseParams(url) {
  let params = {
    target: 'NORMAL'
  };
  params = {
    imagePath: decodeURIComponent(url.replace(widthRegex, '').replace(widthHeightRegex, '').replace(heightRegex, '').replace(/^\//, ''))
  }
  if (sizeMatch = url.match(widthRegex)) {
    params.size = {
      width: sizeMatch[1]
    }
  } else if (sizeMatch = url.match(widthHeightRegex)) {
    params.size = {
      width: sizeMatch[1],
      height: sizeMatch[2]
    }
  } else if (sizeMatch = url.match(heightRegex)) {
    params.size = {
      height: sizeMatch[1]
    }
  }
  return params
}