#FROM node:stretch
FROM resin/raspberrypi3-node:onbuild
#RUN apk add --update libxml2 libxslt
RUN apt-get update
RUN apt-get -y upgrade
RUN echo exit 0 > /usr/sbin/policy-rc.d
RUN apt-get install  -y bluetooth bluez libbluetooth-dev libudev-dev libcap2-bin dbus
#RUN setcap cap_net_raw+eip $(eval readlink -f `which node`)

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
RUN npm install -g babel mocha
RUN npm install
# If you are building your code for production
# RUN npm install --only=production

# Bundle app source
COPY . .

CMD [ "npm", "start" ]
