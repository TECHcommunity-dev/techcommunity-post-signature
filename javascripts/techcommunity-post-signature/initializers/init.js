import { withPluginApi } from "discourse/lib/plugin-api";

export default {
    name: "techcommunity-post-signature",
    initialize() {
        withPluginApi("0.8.8", (api) => {
            api.modifyClass("controller:composer", {
                pluginId: 'techcommunity-post-signature-composer-controller',
                async _setModel(optionalComposerModel, opts) {
                    this._super(optionalComposerModel, opts);

                    if (!opts.draftKey) {
                        throw new Error("composer opened without a proper draft key");
                    }
                    if (!this.currentUser) {
                        return;
                    }

                    const enablePostUserSignature = settings.enable_post_user_group_signature;
                    const postUserGroupSignatures = settings.post_user_group_signatures;
                    //Display signature if enabled and specified atleast one signature.
                    if (!enablePostUserSignature || !postUserGroupSignatures.length) {
                        return;
                    }
                    
                    //Display signature only for the the Create new topic and reply post
                    if(opts?.action === "createTopic" || opts?.action === "reply") {
                        const model = optionalComposerModel || this.store.createRecord("composer");
                        await model.open(opts);
                        //If current Topic is Private message then return
                        if(opts?.action === "reply" && this.model?.topic.archetype === "private_message") {
                            return;
                        }
                        //If composer model is null then return.
                        if(!this.model) {
                            return;
                        }
                        let reply = this.model.reply;
                        let signature = "";
                        
                        //Getting the First matched Group between the currentUser groups and postUserGroupSignatures groups
                        let currentUserGroupSignature = postUserGroupSignatures
                        .split("|")
                        .find((postUserGroupSignature) => { 
                            const [
                                groupName,
                            ] = postUserGroupSignature
                                .split(",")
                                .filter(Boolean)
                                .map((x) => x.trim());
                            let selectedGroup = this.currentUser.groups.find(group => group.name.toLowerCase() === groupName.toLowerCase());
                            return selectedGroup ? true : false;
                        });
                        //If User not belongs to any of the groups then return.
                        if(!currentUserGroupSignature) {
                            return;
                        }
                        const [
                            groupName,
                            linkText,
                            linkHref,
                            assetBannerkey,
                            bannerHref
                        ] = currentUserGroupSignature
                            .split(",")
                            .filter(Boolean)
                            .map((x) => x.trim());

                        signature = `\n\n\n\n\n\n\n\n\n\n<div data-class="user-signature"><hr /><div data-class="user-signature-name">${this.currentUser.custom_fields.user_field_6} ${this.currentUser.custom_fields.user_field_7}</div><div data-class="user-signature-link">\n\n[${linkText}](${linkHref})</div><div data-class="user-signature-banner">\n\n[<img src="${settings.theme_uploads[assetBannerkey]}" />](${bannerHref})</div></div>`;
                        //Finally append the signature to the reply content
                        this.model.set("reply", reply.concat(signature));
                        this.model.set("originalText", reply.concat(signature));                        
                    }
                }
            });
        });
    }
}