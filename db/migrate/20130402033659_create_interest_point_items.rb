class CreateInterestPointItems < ActiveRecord::Migration
  def change
    create_table :interest_point_items do |t|
      t.integer :interest_point_id
      t.integer :interp_item_id
      t.integer :position

      t.timestamps
    end
  end
end
