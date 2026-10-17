# Semantic Injection

Node's module resolution works on a folder hierarchy where an applications dependencies are stored in a `node_modules` folder and dependencies can either be shared across multiple transient dependencies or localized to a specific dependency's needs. This means that if you have an npm package installed in your app that has a dependency on foo@1.1.1 and another that uses foo@2.0.0, both can co-exist in the same app domain.

This is a powerful feature of the node/npm ecosystem and one that developers take advantage of everyday when building their apps. However, it is often the case that this semantic version isolation is not extended to your DI container. This is something this library is trying help with.

When constructing a tree of dependencies our DI container will guarantee that each injected instance into a constructor will match the semantic version the consuming code was built against. This means that you can introduce new versions of libraries into your application in a more natural and safe manner, avoiding big bang migrations. The DI system will automatically manage the what and where of injection into your types.

Further, due to the way npm organizes semantic versions, if you have two or more dependencies in your app that rely on foo@^1.x.x, then npm will determine what is the latest compatible version of the @foo dependency being used and then synchronize all the others to use that by de-duping out older versions. So versions 1.1.1 and 1.2.1 would be aligned to 1.5.0 if that was being used. Read more about that [here](https://docs.npmjs.com/cli/dedupe)

Semantic injection is a powerful technique for isolating change and instead letting it trickle through your system. It can extend all the way through your package hierarchy and requires little effort from the developers to manage.
