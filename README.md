<a href="https://www.nylas.com/">
    <img src="https://brand.nylas.com/assets/downloads/logo_horizontal_png/Nylas-Logo-Horizontal-Blue_.png" alt="Aimeos logo" title="Aimeos" align="right" height="60" />
</a>

# Nylas Node.js SDK  

[![codecov](https://codecov.io/gh/nylas/nylas-nodejs/branch/main/graph/badge.svg?token=94IMGU4F09)](https://codecov.io/gh/nylas/nylas-nodejs)

This is the GitHub repository for the Nylas Node SDK and this repo is primarily for anyone who wants to make contributions to the SDK or install it from source. If you are looking to use Node to access the Nylas Email, Calendar, or Contacts API you should refer to our official [Node SDK Quickstart Guide](https://developer.nylas.com/docs/developer-tools/sdk/node-sdk/).

The Nylas Communications Platform provides REST APIs for [Email](https://developer.nylas.com/docs/connectivity/email/), [Calendar](https://developer.nylas.com/docs/connectivity/calendar/), and [Contacts](https://developer.nylas.com/docs/connectivity/contacts/), and the Node SDK is the quickest way to build your integration using JavaScript.

Here are some resources to help you get started:

- [Nylas SDK Tutorials](https://developer.nylas.com/docs/the-basics/tutorials/nodejs/)
- [Quickstart](https://developer.nylas.com/docs/the-basics/quickstart/)
- [Nylas API Reference](https://developer.nylas.com/docs/api/)


## ⚙️ Install

**Note:** The Nylas Node SDK requires Node.js v16 or later.

### Set up using npm

To run the Nylas Node SDK, you will first need to have [Node](https://nodejs.org/en/download/) and [npm](https://www.npmjs.com/get-npm) installed on your machine.

Then, head to the nearest command line and run the following:
`npm install nylas`

Alternatively, if you prefer to use [Yarn](https://yarnpkg.com/en/), you can install the Nylas Node SDK with `yarn add nylas`

### Build from source

To install this package from source, clone this repo and run `npm install` from inside the project directory.

```bash
git clone https://github.com/nylas/nylas-nodejs.git
cd nylas-nodejs
npm install
```

## ⚡️ Usage

To use this SDK, you must first [get a free Nylas account](https://dashboard.nylas.com/register).

Then, follow the Quickstart guide to [set up your first app and get your API keys](https://developer.nylas.com/docs/v3-beta/v3-quickstart/).

For code examples that demonstrate how to use this SDK, take a look at our [Node repos in the Nylas Samples collection](https://github.com/orgs/nylas-samples/repositories?q=&type=all&language=javascript&sort=).

### 🚀 Making Your First Request

Every resource (i.e., messages, events, contacts) is accessed via an instance of `Nylas`. Before making any requests, be sure to call `config` and initialize the `Nylas` instance with your `clientId` and `clientSecret`. Then, call `with` and pass it your `accessToken`. The `accessToken` allows `Nylas` to make requests for a given account's resources.

```typescript
import Nylas from "nylas";

const nylas = new Nylas({
  apiKey: "NYLAS_API_KEY",
});
```

Then, you can use Nylas to access information about a user's account:
```typescript
nylas.calendars.list({ identifier: "GRANT_ID" }).then(calendars => {
  console.log(calendars);
});
```

## 📚 Documentation

Nylas maintains a [reference guide for the Node SDK](https://nylas-nodejs-sdk-reference.pages.dev/) to help you get familiar with the available methods and classes.

## 💙 Contributing

Please refer to [Contributing](Contributing.md) for information about how to make contributions to this project. We welcome questions, bug reports, and pull requests.

## 📝 License

This project is licensed under the terms of the MIT license. Please refer to [LICENSE](LICENSE.txt) for the full terms. 


