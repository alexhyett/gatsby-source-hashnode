import debug from "debug";
import readingTime from "reading-time";
import { HASHNODE_NODE_TYPE } from "./consts";
import { getUserDetails } from "./get-user-details";
import { getUserPosts } from "./get-user-posts";

const logger = debug(`gatsby-source-hashnode:source-nodes`);

export async function sourceNodes(
  { actions, createNodeId, createContentDigest, getCache },
  { username }
) {
  try {
    logger("sourcing-nodes");

    const { createNode } = actions;
    // check username exists
    if (!username) {
      throw new Error("no username supplied");
    }

    // create hash node user
    const userDetails = await getUserDetails(username);

    const hashNodeUser = {
      ...userDetails,
      id: createNodeId(userDetails._id),
      parent: null,
      children: [],
      internal: {
        type: "HashNodeUser",
        description: "details about the user",
        contentDigest: createContentDigest(userDetails._id),
      },
    };

    createNode(hashNodeUser);

    // get posts
    const posts = await getUserPosts(username);

    // process posts
    posts.map((post) => {
      const { _id, contentMarkdown = "" } = post;

      const nodeSchema = {
        ...post,
        readingTime: readingTime(contentMarkdown),
        id: createNodeId(_id),
        parent: null,
        children: [],
        internal: {
          type: HASHNODE_NODE_TYPE,
          mediaType: `text/markdown`,
          content: contentMarkdown,
          contentDigest: createContentDigest(post),
        },
      };

      // create the node
      createNode(nodeSchema);
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
