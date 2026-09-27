// In-memory previews, separated by account and cleared on a full page reload.
const postsByAccount = new Map();
export function getPreviewPosts(account = 'demo') {
  return postsByAccount.get(account) || [];
}
export function addPreviewPost(account = 'demo', post) {
  postsByAccount.set(account, [post, ...getPreviewPosts(account)]);
}
