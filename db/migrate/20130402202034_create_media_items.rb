class CreateMediaItems < ActiveRecord::Migration
  def change
    create_table :media_items do |t|
      t.integer :position
      t.string :mimetype
      t.string :name
      t.integer :interp_item_id

      t.timestamps
    end
  end
end
