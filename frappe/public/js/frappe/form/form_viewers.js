frappe.ui.form.FormViewers = class FormViewers {
	constructor({ frm, parent }) {
		this.frm = frm;
		this.parent = parent;
		this.parent.tooltip({ title: __("Currently Viewing") });

		this.past_users = []; // Remember last users to compute changes
		this.active_users = []; // current users viewing this form
		this.setup_events();
	}

	refresh() {
		if (!this.active_users.length) {
			this.parent.empty();
			return;
		}
		let avatar_group = frappe.avatar_group(this.active_users, 5, {
			align: "left",
			overlap: true,
		});
		this.parent.empty().append(avatar_group);
	}

	setup_events() {
		let me = this;
		frappe.realtime.off("doc_viewers");
		frappe.realtime.on("doc_viewers", function (data) {
			me.update_users(data);
		});
	}

	async update_users({ doctype, docname, users = [] }) {
		users = users.filter((u) => u != frappe.session.user);

		const added_users = users.filter((user) => !this.past_users.includes(user));
		const removed_users = this.past_users.filter((user) => !users.includes(user));
		const changed_users = [...added_users, ...removed_users];

		if (changed_users.length === 0) return;

		await this.fetch_user_info(users);

		this.active_users = users;
		this.past_users = users;

		if (this.frm?.doc?.doctype === doctype && this.frm?.doc?.name == docname) {
			this.refresh();
		}
	}

	async fetch_user_info(users) {
		let unknown_users = [];
		for (let user of users) {
			if (!frappe.boot.user_info[user]) unknown_users.push(user);
		}
		if (!unknown_users) return;

		const data = await frappe.xcall("frappe.desk.form.load.get_user_info_for_viewers", {
			users: unknown_users,
		});
		Object.assign(frappe.boot.user_info, data);
	}
};
